import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Contact } from '../../../../contacts/entities/contact.entity';
import { HASH_SALT } from '../../../../common/constants';
import { CreateUserDto, QueryUsersDto, UpdateUserDto } from '../dto';
import { SubscriptionService } from '../../../../billing/services/subscription.service';

@Injectable()
export class AdminUsersService {
	constructor(
		@InjectRepository(Contact)
		private repo: Repository<Contact>,
		private subscriptionService: SubscriptionService,
	) {}

	private applyFilters(qb: SelectQueryBuilder<Contact>, q: QueryUsersDto) {
		if (q.search) {
			qb.andWhere(
				'(contacts.first_name ILIKE :s OR contacts.last_name ILIKE :s OR contacts.email ILIKE :s)',
				{ s: `%${q.search}%` },
			);
		}
		if (q.email)
			qb.andWhere('contacts.email ILIKE :email', {
				email: `%${q.email}%`,
			});
		if (q.role) qb.andWhere('contacts.role = :role', { role: q.role });
		if (typeof q.isVerified === 'boolean')
			qb.andWhere('contacts.is_verified = :v', { v: q.isVerified });
		if (q.createdFrom)
			qb.andWhere('contacts.created_at >= :from', {
				from: q.createdFrom,
			});
		if (q.createdTo)
			qb.andWhere('contacts.created_at <= :to', { to: q.createdTo });
		return qb;
	}

	async findAll(q: QueryUsersDto) {
		const page = q.page ?? 1;
		const limit = Math.min(q.limit ?? 25, 100);
		const qb = this.repo
			.createQueryBuilder('contact')
			.leftJoin('free_access', 'free', 'free.user_id = contact.id');

		if (q.withDeleted) qb.withDeleted();

		qb.select([
			'contact.id as contact_id',
			'contact.first_name as contact_first_name',
			'contact.last_name as contact_last_name',
			'contact.email as contact_email',
			'contact.role as contact_role',
			'contact.avatar as contact_avatar',
			'contact.is_verified as contact_is_verified',
			'contact.created_at as contact_created_at',
			'free.id as free_id',
			'free.permanent as free_permanent',
		]);

		if (q.email) {
			qb.andWhere('LOWER(contact.email) LIKE :email', {
				email: `%${q.email.toLowerCase()}%`,
			});
		}

		const [rows, total] = await Promise.all([
			qb.getRawMany(),
			qb.getCount(),
		]);

		const subscriptionPromises = rows.map((r: any) =>
			r.contact_email
				? this.subscriptionService
						.getSubscriptionInfoByEmail(r.contact_email)
						.catch((): null => null)
				: Promise.resolve(null),
		);

		const subscriptions = await Promise.all(subscriptionPromises);

		const items = rows.map((r: any, index: number) => {
			const subscriptionInfo = subscriptions[index];
			const hasSubscription = !!subscriptionInfo;
			const hasFreeAccess = !!r.free_id;

			let subscriptionStatus:
				| 'none'
				| 'active'
				| 'canceled'
				| 'ended'
				| 'cancel_at_period_end' = 'none';

			if (hasSubscription && subscriptionInfo) {
				if (subscriptionInfo.endedAt) subscriptionStatus = 'ended';
				else if (subscriptionInfo.canceledAt)
					subscriptionStatus = 'canceled';
				else if (subscriptionInfo.cancelAtPeriodEnd)
					subscriptionStatus = 'cancel_at_period_end';
				else subscriptionStatus = 'active';
			}

			return {
				id: Number(r.contact_id),
				firstName: r.contact_first_name ?? null,
				lastName: r.contact_last_name ?? null,
				email: r.contact_email ?? null,
				role: r.contact_role ?? null,
				avatar: r.contact_avatar ?? null,
				isVerified:
					r.contact_is_verified === true ||
					r.contact_is_verified === 'true' ||
					r.contact_is_verified === 't',
				createdAt: r.contact_created_at
					? new Date(r.contact_created_at)
					: null,
				subscription:
					hasSubscription && subscriptionInfo
						? {
								id: subscriptionInfo.id,
								priceId: subscriptionInfo.priceId,
								productId: subscriptionInfo.productId,
								stripeSubscriptionId:
									subscriptionInfo.stripeSubscriptionId,
								currentPeriodEnd:
									subscriptionInfo.currentPeriodEnd,
								canceledAt: subscriptionInfo.canceledAt,
								endedAt: subscriptionInfo.endedAt,
								createdAt: subscriptionInfo.createdAt,
							}
						: null,
				hasSubscription,
				hasFreeAccess,
				freeAccess: hasFreeAccess
					? {
							id: r.free_id,
							permanent:
								r.free_permanent === true ||
								r.free_permanent === 'true' ||
								r.free_permanent === 't',
						}
					: null,
				subscriptionStatus: hasFreeAccess
					? 'free_access'
					: subscriptionStatus,
			};
		});

		return { items, total, page, limit };
	}

	async findOne(id: number): Promise<Contact> {
		const user = await this.repo.findOne({ where: { id } });
		if (!user) throw new NotFoundException();
		return user;
	}

	async create(dto: CreateUserDto): Promise<Contact> {
		const exists = await this.repo.findOne({ where: { email: dto.email } });
		if (exists) throw new BadRequestException('Email exists');
		const ent = this.repo.create(dto);
		if (dto.password)
			ent.password = await bcrypt.hash(dto.password, HASH_SALT);
		return this.repo.save(ent);
	}

	async update(id: number, dto: UpdateUserDto): Promise<Contact> {
		const user = await this.repo.findOne({
			where: { id },
			withDeleted: false,
		});
		if (!user) throw new NotFoundException();
		if (dto.email && dto.email !== user.email) {
			const ex = await this.repo.findOne({ where: { email: dto.email } });
			if (ex) throw new BadRequestException('Email exists');
		}
		if (dto.password)
			dto.password = await bcrypt.hash(dto.password, HASH_SALT);
		await this.repo.update(id, dto);
		return this.repo.findOne({ where: { id } });
	}

	async softRemove(id: number): Promise<{ ok: boolean }> {
		const res = await this.repo.softDelete(id);
		if (res.affected === 0) throw new NotFoundException();
		return { ok: true };
	}

	async restore(id: number): Promise<{ ok: boolean }> {
		const res = await this.repo.restore(id);
		if (res.affected === 0) throw new NotFoundException();
		return { ok: true };
	}

	async hardDelete(id: number): Promise<{ ok: boolean }> {
		const res = await this.repo.delete(id);
		if (res.affected === 0) throw new NotFoundException();
		return { ok: true };
	}
}
