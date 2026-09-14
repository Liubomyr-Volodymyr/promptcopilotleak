import { Injectable } from '@nestjs/common';
import { AutocompleteRequestDto, ACResponseDto } from '../dto';
import { AIService } from '../../ai/services/ai.service';
import { LLModel, PROJECT_KEY } from '../../common/enums';
import { ContextProfilesService } from '../../profiles/services/context-profiles.service';
import { PromptBuilder } from '../../common/prompt.builder';
import { Profile } from '../../profiles/entities/profile.entity';
import { LLMFeatures } from '../../common/enums';
import { LlmConfigService } from '../../ai/services/llm-config.service';
import { calcOverlapFuzzy } from '../utils/fuzzy-overlap.util';
import { parseAiSuggestions } from '../utils/ai-suggestions-parser.util';
import { MemoryRetrievalService } from '../../memory/services/memory-retrieval.service';
import { MemoryAgentService } from '../../memory/services/memory-agent.service';
import {
	IEpisodicMemoryResponse,
	IMemoryProfileResponse,
	IProceduralMemoryResponse,
} from '../../memory/providers/interfaces';
import { MemoryAgent } from '../../memory/entities/memory-agent.entity';

@Injectable()
export class AutocompleteService {
	constructor(
		private readonly aiService: AIService,
		private readonly profileService: ContextProfilesService,
		private readonly llmConfigService: LlmConfigService,
		private readonly memoryAgentService: MemoryAgentService,
		private readonly memoryRetrievalService: MemoryRetrievalService,
	) {}

	async getComplete(
		data: AutocompleteRequestDto,
		userId: string,
		llmModel?: LLModel,
	): Promise<ACResponseDto> {
		const agent = await this.getAgent(userId);
		if (data.profile_id) {
			await this.memoryAgentService.ensureProfileAgentExists(
				Number(userId),
				data.profile_id,
			);
		}

		const llmConfig = await this.llmConfigService.findByKeyModel(
			LLMFeatures.AUTOCOMPLETE,
		);
		const [
			memoryProfile,
			semanticChat,
			currentChat,
			procedural,
			profileMemory,
		] = await this.getMemoryContext(
			userId,
			data.input,
			data.conversationId,
			data.profile_id,
		);

		const contextProfile = await this.getProfileSafe(
			data.profile_id,
			userId,
		);

		const userPrompt = this.buildUserPrompt(
			data,
			contextProfile,
			memoryProfile,
			semanticChat,
			currentChat,
			procedural,
			profileMemory,
			llmModel,
		);

		const t0 = Date.now();
		const llmResponse = await this.llmCompletionRequest(
			llmModel,
			llmConfig,
			userPrompt,
			agent,
		);
		const latency = Date.now() - t0;
		const aiRawSuggestions = llmResponse?.suggestions ?? [];

		const normalizedFulls = aiRawSuggestions
			.map((ai) => {
				const aiLc = ai.toLowerCase();
				const inputLc = data.input.toLowerCase();

				if (aiLc.startsWith(inputLc)) {
					return ai.slice(data.input.length).trim();
				}

				return ai.trim();
			})
			.filter(Boolean);

		const firstSuggestion = normalizedFulls[0] ?? '';

		const overlap = Math.min(
			calcOverlapFuzzy(data.input, firstSuggestion),
			firstSuggestion.length,
		);

		const response: any = {
			input: data.input,
			suggestion: firstSuggestion ? firstSuggestion.slice(overlap).trim() : '',
			suggestions: normalizedFulls,
		};

		if (data.debug === 'true') {
			response.debug = {
				latency,
				promptChars: userPrompt.length,
				estimatedTokens: Math.ceil(userPrompt.length / 4),
				systemPrompt: llmConfig?.systemPrompt?.content,
				userPrompt,
				rawLlmOutput: llmResponse?.raw,
				memory: {
					memoryProfile,
					semanticChat,
					currentChat,
					procedural,
					profileMemory,
				},
			};
		}

		return response;
	}

	private async llmCompletionRequest(
		llmModel: LLModel,
		llmConfig: any,
		userPrompt: string,
		agent: MemoryAgent,
	) {
		const log = (msg: string) => console.log(`[AC ${Date.now()}] ${msg}`);

		try {
			const aiRaw = await this.aiService.aiRequest({
				model: llmModel ?? LLModel.GEMINI_FLASH_LITE,
				prompt: llmConfig.systemPrompt.content,
				message: userPrompt,
				project_key: PROJECT_KEY.CUSTOM,
				agent_key: agent.agentSK,
				feature: LLMFeatures.AUTOCOMPLETE,
				options: {
					timeout: 6000,
					retries: 1,
					retryInterval: 200,
					...llmConfig.defaults,
				},
			});

			log(`aiRequest END length=${aiRaw?.length}`);

			let suggestions: string[] = [];
			const tailMatch = aiRaw?.match(/<tail>([\s\S]*?)<\/tail>/i);
			if (tailMatch) {
				suggestions = [tailMatch[1].trim()].filter(Boolean);
			} else {
				suggestions = parseAiSuggestions(aiRaw, 6).map((s) => s.trim()).filter(Boolean);
			}

			return { suggestions, raw: aiRaw ?? '' };
		} catch (e: any) {
			log(`aiRequest ERROR: ${e.message}`);
			return null;
		}
	}

	private async getProfileSafe(
		profileId: string | undefined,
		userId: string,
	): Promise<Profile | null> {
		try {
			if (!profileId) return null;
			return await this.profileService.findOne(profileId, userId);
		} catch {
			return null;
		}
	}

	private async getAgent(userId: string): Promise<any> {
		await this.memoryAgentService.ensureAgent(Number(userId));
		return this.memoryAgentService.getAgent(userId, null);
	}

	private async getMemoryContext(
		userId: string,
		input?: string,
		conversationId?: string,
		profileId?: string,
	) {
		const [
			memoryProfile,
			semanticSearch,
			conversationHistory,
			procedural,
			profileContext,
		] = await Promise.all([
			this.memoryRetrievalService.retrieveProfile(userId),
			this.memoryRetrievalService
				.retrieve({
					userId,
					query: input,
					limit: 5,
				})
				.catch((e: unknown): any[] => []),
			conversationId
				? this.memoryRetrievalService
						.retrieveEpisodic({
							userId,
							conversationId,
							limit: 5,
						})
						.catch((e: unknown): any[] => [])
				: Promise.resolve([]),
			this.memoryRetrievalService.retrieveProcedural({
				userId,
				limit: 5,
			}),
			this.memoryRetrievalService
				.retrieveProfileAgentContext(userId, profileId, input)
				.catch((): null => null),
		]);

		const chronologicalHistory = [...(conversationHistory as any[])].reverse();

		const historyIds = new Set(chronologicalHistory.map((m: any) => String(m?.id)));

		const filteredSemanticSearch = (semanticSearch as any[]).filter((mem) => {
			if (!mem?.id) return true;
			return !historyIds.has(String(mem.id));
		});

		const formatSemanticChat: string = this.formatEpisodic(filteredSemanticSearch);
		const formatCurrentChat: string = this.formatEpisodic(chronologicalHistory);

		const profileMemory = profileContext
			? {
					description: profileContext.description,
					relevant: this.formatEpisodic(profileContext.relevant as any[]),
			  }
			: null;

		return [
			memoryProfile,
			formatSemanticChat,
			formatCurrentChat,
			procedural,
			profileMemory,
		];
	}

	private formatEpisodic(memories: IEpisodicMemoryResponse[]): string {
		if (!memories?.length) return '';

		return memories
			.map((m) => {
				const content = m.content ?? '';
				const score =
					typeof m.score === 'number' ? m.score.toFixed(3) : '0';

				return `- ${content} (score: ${score})`;
			})
			.join('\n');
	}

	private buildUserPrompt(
		data: AutocompleteRequestDto,
		profile: Awaited<ReturnType<ContextProfilesService['findOne']>>,
		memoryProfile: IMemoryProfileResponse,
		semanticChat: string,
		currentChat: string,
		procedureMemory: IProceduralMemoryResponse,
		profileMemory: { description?: string; relevant?: string } | null,
		llmModel?: LLModel,
	): string {
		return new PromptBuilder()
			.addBlock('DOMAIN', data.domain)
			.addBlock('CONTEXT PROFILE', profile)
			.addBlock('USER PROFILE', memoryProfile?.description)
			.addBlock('PAST RELEVANT CONVERSATIONS', semanticChat)
			.addBlock('CURRENT CHAT HISTORY', currentChat)
			.addBlock('PROCEDURE MEMORY', procedureMemory)
			.addBlock('PROFILE AGENT MEMORY', profileMemory)
			.addBlock('TASK', 'Continue the INPUT text. Return ONLY the continuation inside <tail></tail> tags.')
			.addBlock('INPUT', data.input)
			.build();
	}
}
