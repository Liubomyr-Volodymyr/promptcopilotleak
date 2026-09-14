import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import {
	CreateSubscriptionCheckoutDto,
	SubscriptionInfoDto,
	UrlDto,
} from '../dto/subscription.dto';
import { SubscriptionCustomerService } from './subscription-customer.service';
import { SubscriptionRepository } from './subscription.repository';
import { STRIPE_CLIENT } from '../../common/constants';

@Injectable()
export class SubscriptionService {
	constructor(
		@Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
		private readonly subsCustomer: SubscriptionCustomerService,
		private readonly subscriptionRepo: SubscriptionRepository,
	) {}

	async createCheckoutSession(
		dto: CreateSubscriptionCheckoutDto,
	): Promise<UrlDto> {
		const { stripeCustomerId } = await this.subsCustomer.ensureCustomer(
			dto.email,
			dto.user_id,
		);

		const priceId =
			await this.subscriptionRepo.getActivePriceIdBySlugAndPeriod(
				dto.slug,
				dto.period === 'year' ? 'year' : 'month',
				1,
			);

		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			mode: 'subscription',
			customer: stripeCustomerId,
			line_items: [{ price: priceId, quantity: dto.quantity ?? 1 }],
			allow_promotion_codes: true,
			success_url: process.env.STRIPE_SUCCESS_URL!,
			cancel_url: process.env.STRIPE_CANCEL_URL!,
			metadata: {
				...(dto.metadata || {}),
				slug: dto.slug,
				period: dto.period,
				email: dto.email,
				user_id: dto.user_id ?? '',
			},
		};

		if (dto.trial_period_days) {
			sessionParams.subscription_data = {
				trial_period_days: dto.trial_period_days,
			};
		}

		const session =
			await this.stripe.checkout.sessions.create(sessionParams);

		return { url: session.url! };
	}

	async createPortalSession(email: string): Promise<UrlDto> {
		const { stripeCustomerId } =
			await this.subsCustomer.ensureCustomer(email);
		const session = await this.stripe.billingPortal.sessions.create({
			customer: stripeCustomerId,
			return_url: process.env.STRIPE_SUCCESS_URL!,
		});
		return { url: session.url };
	}

	async getMySubscription(email: string): Promise<SubscriptionInfoDto> {
		const activeSub = await this.findActiveSubscriptionByEmail(email);
		if (!activeSub) {
			return {
				status: 'inactive',
				current_period_end: null,
				cancel_at_period_end: false,
			};
		}
		return {
			status: 'active',
			current_period_end: activeSub.current_period_end,
			cancel_at_period_end: activeSub.cancel_at_period_end,
		};
	}

	async findActiveSubscriptionByEmail(email: string): Promise<{
		current_period_end: string | null;
		cancel_at_period_end: boolean;
	} | null> {
		const { stripeCustomerId } =
			await this.subsCustomer.ensureCustomer(email);

		const subscriptions = await this.stripe.subscriptions.list({
			customer: stripeCustomerId,
			status: 'all',
			limit: 100,
		});

		const now = Math.floor(Date.now() / 1000);
		const activeSubs = subscriptions.data.filter((sub) => {
			if (sub.status === 'canceled' && sub.ended_at) {
				return sub.ended_at > now;
			}
			if (sub.status === 'active' || sub.status === 'trialing') {
				return true;
			}
			return false;
		});

		if (activeSubs.length === 0) {
			return null;
		}

		const latestSub = activeSubs.sort((a, b) => {
			const aEnd = a.current_period_end ?? 0;
			const bEnd = b.current_period_end ?? 0;
			return bEnd - aEnd;
		})[0];

		const endTs = latestSub.current_period_end
			? latestSub.current_period_end * 1000
			: null;
		const nowTs = Date.now();

		if (endTs && endTs < nowTs) {
			return null;
		}

		return {
			current_period_end: latestSub.current_period_end
				? new Date(latestSub.current_period_end * 1000).toISOString()
				: null,
			cancel_at_period_end: !!latestSub.cancel_at_period_end,
		};
	}

	async getSubscriptionInfoByEmail(email: string): Promise<{
		id: string | null;
		priceId: string | null;
		productId: string | null;
		stripeSubscriptionId: string | null;
		currentPeriodEnd: Date | null;
		canceledAt: Date | null;
		endedAt: Date | null;
		createdAt: Date | null;
		cancelAtPeriodEnd: boolean;
	} | null> {
		const { stripeCustomerId } =
			await this.subsCustomer.ensureCustomer(email);

		const subscriptions = await this.stripe.subscriptions.list({
			customer: stripeCustomerId,
			status: 'all',
			limit: 100,
		});

		if (subscriptions.data.length === 0) {
			return null;
		}

		const latestSub = subscriptions.data.sort((a, b) => {
			const aEnd = a.current_period_end ?? 0;
			const bEnd = b.current_period_end ?? 0;
			return bEnd - aEnd;
		})[0];

		const firstItem = latestSub.items?.data?.[0];
		const price = firstItem?.price;
		const productId =
			typeof price?.product === 'string'
				? price.product
				: (price?.product?.id ?? null);

		return {
			id: latestSub.id,
			priceId: price?.id ?? null,
			productId,
			stripeSubscriptionId: latestSub.id,
			currentPeriodEnd: latestSub.current_period_end
				? new Date(latestSub.current_period_end * 1000)
				: null,
			canceledAt: latestSub.canceled_at
				? new Date(latestSub.canceled_at * 1000)
				: null,
			endedAt: latestSub.ended_at
				? new Date(latestSub.ended_at * 1000)
				: null,
			createdAt: latestSub.created
				? new Date(latestSub.created * 1000)
				: null,
			cancelAtPeriodEnd: !!latestSub.cancel_at_period_end,
		};
	}
}
