import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingCustomer } from '../entities/billing-customer.entity';
import { BillingSubscription } from '../entities/billing-subscriptions.entity';
import { SubscriptionPlanPrice } from '../entities/subscription_plan_prices.entity';
import { SubscriptionPlans } from '../entities/plan.entity';
import { FreeAccess } from '../../contacts/entities/free-access.entity';

type UpsertPayload = {
	stripe_subscription_id: string;
	customer: number;
	email?: string;
	price_id?: string;
	product_id?: string;
	cancel_at_period_end?: boolean;
	canceled_at?: string;
	ended_at?: string;
	current_period_start?: string;
	current_period_end?: string;
};

type CreateCustomerPayload = {
	email: string;
	stripe_customer_id: string;
	user_id?: string | number;
};

type UpdateCustomerPayload = {
	email?: string;
	stripe_customer_id?: string;
	user_id?: string | number;
};

@Injectable()
export class SubscriptionRepository {
	constructor(
		@InjectRepository(BillingCustomer)
		private readonly customerRepo: Repository<BillingCustomer>,
		@InjectRepository(BillingSubscription)
		private readonly subRepo: Repository<BillingSubscription>,
		@InjectRepository(SubscriptionPlanPrice)
		private readonly plansPriceRepo: Repository<SubscriptionPlanPrice>,
		@InjectRepository(SubscriptionPlans)
		private readonly plansRepo: Repository<SubscriptionPlans>,
		@InjectRepository(FreeAccess)
		private readonly freeAccessRepo: Repository<FreeAccess>,
	) {}
	async getCustomerIdByStripeCustomer(
		stripeCustomerId: string,
	): Promise<number | null> {
		const row = await this.customerRepo.findOne({
			where: { stripeCustomerId },
			select: { id: true },
		});
		return row?.id ?? null;
	}

	async upsertSubscription(
		payload: UpsertPayload,
	): Promise<BillingSubscription> {
		const customer = await this.customerRepo.findOne({
			where: { id: Number(payload.customer) },
		});
		if (!customer)
			throw new BadRequestException('Billing customer not found');

		const existing = await this.subRepo.findOne({
			where: { stripeSubscriptionId: payload.stripe_subscription_id },
		});

		const toDate = (v?: string) => (v ? new Date(v) : null);

		if (existing) {
			existing.customer = customer;
			existing.email = (payload.email ?? existing.email ?? '')
				.trim()
				.toLowerCase();

			existing.priceId = payload.price_id ?? existing.priceId ?? null;
			existing.productId =
				payload.product_id ?? existing.productId ?? null;

			existing.cancelAtPeriodEnd = !!(
				payload.cancel_at_period_end ?? existing.cancelAtPeriodEnd
			);
			existing.canceledAt =
				toDate(payload.canceled_at) ?? existing.canceledAt ?? null;
			existing.endedAt =
				toDate(payload.ended_at) ?? existing.endedAt ?? null;

			existing.currentPeriodStart =
				toDate(payload.current_period_start) ??
				existing.currentPeriodStart ??
				null;
			existing.currentPeriodEnd =
				toDate(payload.current_period_end) ??
				existing.currentPeriodEnd ??
				null;

			return await this.subRepo.save(existing);
		}

		const created = this.subRepo.create({
			customer,
			email: (payload.email ?? '').trim().toLowerCase(),
			priceId: payload.price_id ?? null,
			productId: payload.product_id ?? null,
			cancelAtPeriodEnd: !!payload.cancel_at_period_end,
			canceledAt: toDate(payload.canceled_at),
			endedAt: toDate(payload.ended_at),
			currentPeriodStart: toDate(payload.current_period_start),
			currentPeriodEnd: toDate(payload.current_period_end),
			stripeSubscriptionId: payload.stripe_subscription_id,
		});

		return await this.subRepo.save(created);
	}

	async findCustomerByEmail(email: string): Promise<{
		id: number;
		email: string;
		stripe_customer_id: string;
	} | null> {
		const row = await this.customerRepo.findOne({
			where: { email },
			select: { id: true, email: true, stripeCustomerId: true },
		});

		if (!row) return null;

		return {
			id: row.id,
			email: row.email,
			stripe_customer_id: row.stripeCustomerId,
		};
	}

	async createCustomer(payload: CreateCustomerPayload) {
		const email = (payload.email ?? '').trim().toLowerCase();
		const entity = this.customerRepo.create({
			email,
			stripeCustomerId: payload.stripe_customer_id,
		});
		return await this.customerRepo.save(entity);
	}

	async updateCustomer(id: number, payload: UpdateCustomerPayload) {
		const row = await this.customerRepo.findOne({ where: { id } });
		if (!row) {
			throw new BadRequestException('Billing customer not found');
		}

		if (payload.email !== undefined) {
			row.email = (payload.email ?? '').trim().toLowerCase();
		}
		if (payload.stripe_customer_id !== undefined) {
			row.stripeCustomerId = payload.stripe_customer_id;
		}

		return await this.customerRepo.save(row);
	}

	async findActiveSubscriptionByEmail(email: string): Promise<{
		current_period_end: string | null;
		cancel_at_period_end: boolean;
	} | null> {
		const now = new Date();

		const sub = await this.subRepo
			.createQueryBuilder('s')
			.where('LOWER(s.email) = :email', { email })
			.andWhere('(s.endedAt IS NULL OR s.endedAt > :now)', { now })
			.andWhere(
				'(s.canceledAt IS NULL OR s.currentPeriodEnd IS NULL OR s.currentPeriodEnd > :now)',
				{ now },
			)
			.orderBy('s.currentPeriodEnd', 'DESC', 'NULLS LAST')
			.addOrderBy('s.createdAt', 'DESC')
			.getOne();

		if (!sub) return null;

		return {
			current_period_end: sub.currentPeriodEnd
				? sub.currentPeriodEnd.toISOString()
				: null,
			cancel_at_period_end: !!sub.cancelAtPeriodEnd,
		};
	}
	async getActivePriceIdBySlugAndPeriod(
		slug: string,
		interval: any,
		intervalCount = 1,
	): Promise<string> {
		const plan = await this.plansRepo.findOne({ where: { slug } });
		if (!plan) throw new BadRequestException(`Unknown plan slug: ${slug}`);

		const price = await this.plansPriceRepo.findOne({
			where: { planId: plan.id, interval, intervalCount, active: true },
			select: { stripePriceId: true },
		});
		if (!price) {
			throw new BadRequestException(
				`No active price for ${slug} (${interval} x ${intervalCount})`,
			);
		}
		return price.stripePriceId;
	}

	async isFreeAccess(userId: string): Promise<boolean> {
		const freeAccess = await this.freeAccessRepo.findOne({
			where: { userId },
		});
		return freeAccess && freeAccess.permanent;
	}
}
