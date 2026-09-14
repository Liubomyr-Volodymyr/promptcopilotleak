import { Injectable } from '@nestjs/common';
import { LLMFeatures, LLModel, PROJECT_KEY } from 'src/common/enums';
import { AIService } from '../../ai/services/ai.service';
import { ContextProfilesService } from '../../profiles/services/context-profiles.service';
import { PromptBuilder } from '../../common/prompt.builder';
import { ProfileAttachmentService } from '../../profiles/services/profile-attachment.service';
import { ProfileAttachment } from '../../profiles/entities/profile-attachment.entity';
import { EnhanceRequestDto } from '../dto';
import {
	ENHANCE_PROMPT_WITH_PROFILE,
	ENHANCE_PROMPT_WITHOUT_PROFILE,
} from '../constants/enhance-prompts';
import { MemoryAgentService } from '../../memory/services/memory-agent.service';
import { MemoryRetrievalService } from '../../memory/services/memory-retrieval.service';
import {
	IEpisodicMemoryResponse,
	IMemoryProfileResponse,
	IProceduralMemoryResponse,
	ISemanticMemoryResponse,
} from '../../memory/providers/interfaces';

type EnhanceContextType = {
	draft: string;
	profile?: Awaited<ReturnType<ContextProfilesService['findOne']>> | null;
	attachmentContext?: ProfileAttachment | null;
	additionalResource?: string;

	memoryProfile?: IMemoryProfileResponse;
	episodicMemory?: string;
	semanticMemory?: ISemanticMemoryResponse;
	procedureMemory?: IProceduralMemoryResponse[];
	profileMemory?: { description?: string; relevant?: string } | null;
};

@Injectable()
export class EnhanceService {
	constructor(
		private readonly aiService: AIService,
		private readonly contextService: ContextProfilesService,
		private readonly attachmentService: ProfileAttachmentService,
		private readonly memoryAgentService: MemoryAgentService,
		private readonly memoryRetrievalService: MemoryRetrievalService,
	) {}

	async enhanceContext(userId: string, text: string) {
		return "enhanced";
	}

	async getEnhancement(
		data: EnhanceRequestDto,
		user_id: string,
		llm_model?: LLModel,
	) {
		await this.memoryAgentService.ensureAgent(Number(user_id));
		if (data.profile_id) {
			await this.memoryAgentService.ensureProfileAgentExists(
				Number(user_id),
				data.profile_id,
			);
		}
		const agent = await this.memoryAgentService.getAgent(user_id, null);

		const [memoryProfile, episodic, semantic, procedural, profileContext] =
			await Promise.all([
				this.memoryRetrievalService.retrieveProfile(user_id),
				this.memoryRetrievalService.retrieve({
					userId: user_id,
					query: data.input,
					limit: 5,
				}),
				this.memoryRetrievalService.retrieveSemantic({
					userId: user_id,
					limit: 5,
				}),
				this.memoryRetrievalService.retrieveProcedural({
					userId: user_id,
					limit: 5,
				}),
				this.memoryRetrievalService
					.retrieveProfileAgentContext(
						user_id,
						data.profile_id,
						data.input,
					)
					.catch((): null => null),
			]);

		const profileMemory = profileContext
			? {
					description: profileContext.description,
					relevant: this.formatEpisodic(
						profileContext.relevant as any[],
					),
				}
			: null;

		let profile = null;
		let attachmentContext = null;
		let additionalResource = null;

		if (data.profile_id) {
			profile = await this.contextService.findOne(
				data.profile_id,
				user_id,
			);
			if (!profile) {
				console.warn(
					`[EnhanceService] Profile not found: ${data.profile_id}`,
				);
			} else {
				attachmentContext = await this.attachmentService.findOne(
					profile.id,
				);

				if (profile?.link_contexts?.length > 0) {
					additionalResource = profile.link_contexts
						.map((link: any) => {
							const parts = [];
							if (link.title) parts.push(`Title: ${link.title}`);
							if (link.description)
								parts.push(`Description: ${link.description}`);
							if (link.bio) parts.push(`Bio: ${link.bio}`);
							if (link.content)
								parts.push(
									`Content: ${link.content.substring(0, 500)}`,
								);
							if (link.companyName)
								parts.push(`Company: ${link.companyName}`);
							return parts.length > 0
								? `[${link.type?.toUpperCase() || 'LINK'}] ${link.url}\n${parts.join('\n')}`
								: null;
						})
						.filter(Boolean)
						.join('\n\n---\n\n');
				}
			}
		}

		const userMessage = this.buildUserPrompt({
			draft: data.input,
			profile,
			attachmentContext,
			additionalResource,
			memoryProfile,
			episodicMemory: this.formatEpisodic(episodic),
			semanticMemory: semantic,
			procedureMemory: procedural.items,
			profileMemory,
		});

		const model = llm_model ?? LLModel.GEMINI_FLASH;

		const raw = await this.aiService.aiRequest({
			model,
			prompt: this.getSysPrompt(profile),
			message: userMessage,
			project_key: PROJECT_KEY.CONTEXT,
			feature: LLMFeatures.ENHANCE,
			agent_key: agent.agentSK,
		});

		return {
			input: data.input,
			suggestion: raw,
		};
	}

	private buildUserPrompt(context: EnhanceContextType): string {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, profileId, ...attachContext } =
			context?.attachmentContext ?? {};

		const profileObj = {
			...(context?.profile?.profile ?? {}),
			style_tone: context?.profile?.style_tone,
		};

		return new PromptBuilder()
			.addBlock('USER DRAFT', context.draft)
			.addBlock('USER PROFILE MEMORY', context.memoryProfile?.description)
			.addBlock('EPISODIC MEMORY', context.episodicMemory)
			.addBlock('SEMANTIC MEMORY', context.semanticMemory?.items)
			.addBlock('PROCEDURAL MEMORY', context.procedureMemory)
			.addBlock('PROFILE AGENT MEMORY', context.profileMemory)
			.addBlock('CONTEXT PROFILE', profileObj)
			.addBlock('FILE (PROFILE ATTACHMENT)', attachContext)
			.addBlock('PARSED LINK CONTEXT', context.additionalResource)

			.build();
	}

	private formatEpisodic(memories: IEpisodicMemoryResponse[]): string {
		if (!memories?.length) return '';

		return memories
			.map((m) => {
				const content = m.content ?? '';

				return `- ${content}`;
			})
			.join('\n');
	}

	private getSysPrompt(
		profile: Awaited<ReturnType<ContextProfilesService['findOne']>> | null,
	): string {
		return profile
			? ENHANCE_PROMPT_WITH_PROFILE
			: ENHANCE_PROMPT_WITHOUT_PROFILE;
	}
}
