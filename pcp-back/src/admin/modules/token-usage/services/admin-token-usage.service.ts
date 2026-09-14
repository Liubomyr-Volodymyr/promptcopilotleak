import {
	Injectable,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenUsage } from '../../../../token-tracker/entities/token-usage.entity';
import { QueryTokenUsageDto } from '../dto/query-token-usage.dto';

@Injectable()
export class AdminTokenUsageService {
	constructor(
		@InjectRepository(TokenUsage)
		private repo: Repository<TokenUsage>,
	) {}

	private buildBaseQuery(q: QueryTokenUsageDto) {
		const qb = this.repo.createQueryBuilder('t');
		if (q.userId) qb.andWhere('t.user_id = :userId', { userId: q.userId });
		if (q.model)
			qb.andWhere('t.model ILIKE :model', { model: `%${q.model}%` });
		if (q.feature)
			qb.andWhere('t.feature = :feature', { feature: q.feature });
		if (q.dateFrom)
			qb.andWhere('t.created_at >= :from', { from: q.dateFrom });
		if (q.dateTo) qb.andWhere('t.created_at <= :to', { to: q.dateTo });
		return qb;
	}

	async findAll(q: QueryTokenUsageDto) {
		const page = q.page ?? 1;
		const limit = Math.min(q.limit ?? 50, 1000);

		if (!q.sortBy) q.sortBy = 'created_at';
		if (!q.order) q.order = 'DESC';

		if (q.groupBy && q.groupBy !== 'none') {
			if (q.groupBy === 'user') {
				try {
					const grouped = await this.repo
						.createQueryBuilder('t')
						.where(q.userId ? 't.user_id = :userId' : '1=1', {
							userId: q.userId,
						})
						.andWhere(q.model ? 't.model ILIKE :model' : '1=1', {
							model: `%${q.model}%`,
						})
						.andWhere(q.feature ? 't.feature = :feature' : '1=1', {
							feature: q.feature,
						})
						.andWhere(
							q.dateFrom ? 't.created_at >= :from' : '1=1',
							{ from: q.dateFrom },
						)
						.andWhere(q.dateTo ? 't.created_at <= :to' : '1=1', {
							to: q.dateTo,
						})
						.leftJoin(
							'contacts',
							'c',
							"t.user_id ~ '^[0-9]+$' AND t.user_id::int = c.id",
						)
						.select('t.user_id', 'user_id')
						.addSelect('c.email', 'email')
						.addSelect('c.first_name', 'first_name')
						.addSelect('c.last_name', 'last_name')
						.addSelect('c.role', 'role')
						.addSelect('c.avatar', 'avatar')
						.addSelect(
							'COALESCE(SUM(t.prompt_tokens),0)::bigint',
							'prompt_tokens',
						)
						.addSelect(
							'COALESCE(SUM(t.completion_tokens),0)::bigint',
							'completion_tokens',
						)
						.addSelect(
							'COALESCE(SUM(t.total_tokens),0)::bigint',
							'total_tokens',
						)
						.groupBy('t.user_id')
						.addGroupBy('c.email')
						.addGroupBy('c.first_name')
						.addGroupBy('c.last_name')
						.addGroupBy('c.role')
						.addGroupBy('c.avatar')
						.orderBy('COALESCE(SUM(t.total_tokens),0)', 'DESC')
						.getRawMany();

					const data = grouped.map((g) => ({
						userId: g.user_id ?? null,
						email: g.email ?? null,
						firstName: g.first_name ?? null,
						lastName: g.last_name ?? null,
						role: g.role ?? null,
						avatar: g.avatar ?? null,
						promptTokens: Number(g.prompt_tokens ?? 0),
						completionTokens: Number(g.completion_tokens ?? 0),
						totalTokens: Number(g.total_tokens ?? 0),
					}));

					return { data, meta: { groupBy: 'user' } };
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
				} catch (err) {
					console.error(err);
				}
			}
		}

		const qb = this.buildBaseQuery(q);

		qb.orderBy(`t.${q.sortBy}`, q.order as 'ASC' | 'DESC')
			.skip((page - 1) * limit)
			.take(limit);

		const [items, total] = await qb.getManyAndCount();

		const totals = await this.repo
			.createQueryBuilder('t')
			.select('SUM(t.prompt_tokens)', 'promptTokens')
			.addSelect('SUM(t.completion_tokens)', 'completionTokens')
			.addSelect('SUM(t.total_tokens)', 'totalTokens')
			.where(q.userId ? 't.user_id = :userId' : '1=1', {
				userId: q.userId,
			})
			.andWhere(q.model ? 't.model ILIKE :model' : '1=1', {
				model: `%${q.model}%`,
			})
			.andWhere(q.feature ? 't.feature = :feature' : '1=1', {
				feature: q.feature,
			})
			.andWhere(q.dateFrom ? 't.created_at >= :from' : '1=1', {
				from: q.dateFrom,
			})
			.andWhere(q.dateTo ? 't.created_at <= :to' : '1=1', {
				to: q.dateTo,
			})
			.getRawOne();

		const promptTokens = Number(totals?.promptTokens ?? 0);
		const completionTokens = Number(totals?.completionTokens ?? 0);
		const totalTokens = Number(totals?.totalTokens ?? 0);

		let cost: number | null = null;
		if (
			typeof q.promptPrice === 'number' ||
			typeof q.completionPrice === 'number'
		) {
			const pp = Number(q.promptPrice ?? 0);
			const cp = Number(q.completionPrice ?? 0);
			cost = promptTokens * pp + completionTokens * cp;
		}

		return {
			items,
			meta: { total, page, limit },
			totals: { promptTokens, completionTokens, totalTokens, cost },
		};
	}

	async findOne(id: number) {
		const item = await this.repo.findOne({ where: { id } });
		if (!item) throw new NotFoundException();
		return item;
	}

	async delete(id: number) {
		const res = await this.repo.delete(id);
		if (res.affected === 0) throw new NotFoundException();
		return { ok: true };
	}

	async bulkDelete(ids: number[]) {
		if (!Array.isArray(ids) || ids.length === 0)
			throw new BadRequestException();
		const res = await this.repo.delete(ids);
		return { affected: res.affected ?? 0 };
	}
}
