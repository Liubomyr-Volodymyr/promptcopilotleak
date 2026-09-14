import { Inject, Injectable } from '@nestjs/common';
import {
	GetEpisodicMemoryInput,
	MemoryProvider,
	MemoryRecord,
	SearchMemoryInput,
} from '../providers/interfaces';
import { MemoryRankingService } from './memory-ranking.service';
import { MemoryCacheService } from './memory-cache.service';
import { MEMORY_PROVIDER } from '../../common/constants';

@Injectable()
export class MemoryRetrievalService {
	constructor(
		@Inject(MEMORY_PROVIDER)
		private readonly provider: MemoryProvider,
		private readonly rankingService: MemoryRankingService,
		private readonly cache: MemoryCacheService,
	) {}

	async retrieveProfile(
		userId: string,
		profileId?: string | null,
	): Promise<any> {
		return await this.provider.getProfile({ userId, profileId });
	}

	async retrieve(input: SearchMemoryInput): Promise<MemoryRecord[]> {
		const cacheKey = this.buildSafeCacheKey(input);

		try {
			const cached = await this.cache.get(cacheKey);

			if (cached) {
				const parsed = JSON.parse(cached);
				if (Array.isArray(parsed)) return parsed;
			}
		} catch {
			// ignore cache failures
		}

		let memories: MemoryRecord[] = [];

		try {
			memories = await this.provider.search({
				...input,
				limit: input.limit ?? 20,
			});
		} catch {
			memories = [];
		}

		if (!memories.length) return [];

		let ranked: MemoryRecord[];

		try {
			ranked = this.rankingService.rank(memories, input);
		} catch {
			ranked = memories;
		}

		const limit = input.limit ?? 10;

		const result = ranked.slice(0, limit);

		try {
			await this.cache.set(cacheKey, JSON.stringify(result), 60);
		} catch {
			/* ignore */
		}

		return result;
	}

	async retrieveSemantic(input: Partial<SearchMemoryInput>) {
		return this.provider.getSemantic(input);
	}

	async retrieveProcedural(input: Partial<SearchMemoryInput>) {
		return this.provider.getProcedural({
			userId: input.userId,
			profileId: input.profileId,
		});
	}

	async retrieveEpisodic(input: GetEpisodicMemoryInput) {
		return this.provider.getEpisodic(input);
	}

	/**
	 * Fetches the profile agent's own memory (description + input-relevant
	 * semantic matches) so callers can layer it on top of the personal
	 * agent's context. Returns null when no profileId is given.
	 */
	async retrieveProfileAgentContext(
		userId: string,
		profileId?: string | null,
		query?: string,
	): Promise<{ description?: string; relevant: MemoryRecord[] } | null> {
		if (!profileId) return null;

		const [profile, relevant] = await Promise.all([
			this.retrieveProfile(userId, profileId),
			this.retrieve({ userId, profileId, query, limit: 5 }).catch(
				(): MemoryRecord[] => [],
			),
		]);

		return { description: profile?.description, relevant };
	}

	private buildSafeCacheKey(input: SearchMemoryInput): string {
		return this.cache.buildKey({
			userId: input.userId,
			profileId: input.profileId,
			query: input.query,
			limit: input.limit,
		});
	}
}
