import { Inject, Injectable } from '@nestjs/common';
import {
	MemoryProvider,
	RememberEpisodicMemoryInput,
} from '../../memory/providers/interfaces';
import { MEMORY_PROVIDER } from 'src/common/constants';
import { AcceptedCompletionDto } from '../dto';
import { ConversationLLMResponseDto } from '../dto/conversation-llm-response.dto';

@Injectable()
export class MemoryStoreService {
	constructor(
		@Inject(MEMORY_PROVIDER)
		private readonly provider: MemoryProvider,
	) {}

	async ingestAutocompleteAccepted(
		userId: string,
		dto: AcceptedCompletionDto,
		conversationId?: string,
	): Promise<void> {
		await this.store(
			userId,
			{
				text: [
					'Autocomplete accepted',
					`Input: ${dto.input}`,
					`Suggestion: ${dto.completion}`,
					`Result: ${dto.finalText}`,
				].join('\n'),
				role: 'user',
				metadata: {
					source: 'autocomplete',
					domain: dto.domain,
					language: dto.language,
					request_id: dto.requestId,
					conversation_id: conversationId ?? 'none',
				},
			},
			dto.profile_id,
		);
	}

	async ingestCompletionRequest(
		userId: string,
		dto: AcceptedCompletionDto,
	): Promise<void> {
		if (dto.accepted) {
			await this.ingestAutocompleteAccepted(userId, dto, dto.conversationId);
		} else {
			await this.ingestUserMessage(
				userId,
				dto.finalText,
				dto.conversationId,
				dto.profile_id,
			);
		}
	}

	async ingestUserMessage(
		userId: string,
		text: string,
		conversationId?: string,
		profileId?: string,
	): Promise<void> {
		await this.store(
			userId,
			{
				text: ['User message', `Result: ${text}`].join('\n'),
				role: 'user',
				metadata: {
					user_id: String(userId),
					conversation_id: conversationId ?? 'none',
				},
			},
			profileId,
		);
	}

	async ingestAssistantResponse(
		userId: string,
		dto: ConversationLLMResponseDto,
	): Promise<void> {
		await this.store(
			userId,
			{
				text: `LLM response model ${dto.model}\n${dto.text}`,
				role: 'assistant',
				metadata: {
					source: 'conversation',
					conversation_id: dto.conversationId,
					message_id: dto.messageId,
					model: dto.model,
					platform: dto.platform,
				},
			},
			dto.profile_id,
		);
	}

	/**
	 * Always writes to the user's personal agent, and additionally to the
	 * profile agent when profileId is set, so profile-scoped memory actually
	 * accumulates instead of staying empty forever.
	 */
	private async store(
		userId: string,
		params: {
			text: string;
			role: 'user' | 'assistant';
			metadata: Record<string, unknown>;
		},
		profileId?: string,
	): Promise<void> {
		try {
			const memory: RememberEpisodicMemoryInput = {
				text: params.text,
				role: params.role,
				memory_metadata: params.metadata,
				occurred_at: new Date().toISOString(),
			};

			await Promise.all([
				this.provider.remember(userId, memory, null),
				profileId
					? this.provider.remember(userId, memory, profileId)
					: Promise.resolve(),
			]);
		} catch (e: any) {
			console.error('[MemoryStoreService.store]', {
				status: e?.response?.status,
				data: e?.response?.data,
				message: e?.message,
			});
		}
	}
}
