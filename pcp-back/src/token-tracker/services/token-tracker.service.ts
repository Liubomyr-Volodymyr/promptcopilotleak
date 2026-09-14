import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenUsage } from '../entities/token-usage.entity';
import { TokenCount, TokenCounterService } from './token-counter.service';
import { ChatResponse } from 'llm-api/dist/src/types';
import { AssistantResponse } from '../../ai/dto/assistant.dto';

export type TokenMeta = {
	userId?: string;
	requestId?: string;
	feature?: string;
};

@Injectable()
export class TokenTrackerService {
	constructor(
		@InjectRepository(TokenUsage)
		private readonly repo: Repository<TokenUsage>,
		private readonly counterService: TokenCounterService,
	) {}

	async countAndRecordText(
		model: string,
		raw: ChatResponse | AssistantResponse,
		promptText: string,
		completionText?: string,
		meta?: TokenMeta,
	) {
		const counts: TokenCount = raw?.usage
			? {
					model,
					promptTokens: raw.usage.promptTokens,
					completionTokens: raw.usage.completionTokens,
					totalTokens: raw.usage.totalTokens,
				}
			: this.counterService.countText(
					model,
					promptText,
					completionText ?? '',
				);

		const payload = {
			userId: meta?.userId ?? null,
			requestId: meta?.requestId ?? null,
			feature: meta?.feature ?? null,
			model,
			promptTokens: counts.promptTokens,
			completionTokens: counts.completionTokens,
			totalTokens: counts.totalTokens,
		};

		const rec = this.repo.create(payload);
		await this.repo.save(rec);

		return { counts, rec };
	}
}
