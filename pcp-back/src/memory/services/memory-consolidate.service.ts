import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

import { GetContextDto } from '../dto/get-context.dto';
import { AIService } from '../../ai/services/ai.service';
import { LLMFeatures, LLModel, PROJECT_KEY } from '../../common/enums';
import { MEMORY_PROVIDER } from '../../common/constants';
import { MemoryProvider } from '../providers/interfaces';
import { InjectContextResponse } from '../dto/inject-context.response.dto';
import { MemoryAgentService } from './memory-agent.service';

interface IContextResponse {
	prompt: string;
	variables: Record<string, string>;
}

@Injectable()
export class MemoryConsolidateService {
	constructor(
		private readonly aiService: AIService,
		@Inject(MEMORY_PROVIDER)
		private readonly midbrain: MemoryProvider,
		private readonly memoryAgentService: MemoryAgentService,
	) {}

	async getInjectContext(
		input: string,
		userId: string,
	): Promise<InjectContextResponse> {
		const contextProfile = await this.getInjectionMemory(input, userId);
		return {
			prompt: contextProfile,
		};
	}

	async getContext(
		userId: string,
		getContextDto: GetContextDto,
	): Promise<IContextResponse> {
		try {
			const { prompt_body, variables, profileId } = getContextDto;

			if (!variables || variables.length === 0) {
				return {
					prompt: prompt_body,
					variables: {},
				};
			}

			if (profileId) {
				await this.memoryAgentService.ensureProfileAgentExists(
					Number(userId),
					profileId,
				);
			}

			const relevantMemory = await this.getRelevantMemory(
				userId,
				prompt_body,
				profileId,
			);

			const raw = await this.aiService.aiRequest({
				model: LLModel.OPENROUTER_QWEN,
				project_key: PROJECT_KEY.CONTEXT,
				feature: LLMFeatures.ENHANCE,
				prompt: `
You receive:
1. Prompt template variables
2. Relevant memory

Return ONLY valid JSON.

Variables:
${JSON.stringify(variables)}

Relevant memory:
${JSON.stringify(relevantMemory)}

Expected format:
{
	"variable_name": "value"
}
				`,
				message: '',
			});

			const filledVars = this.parseRawObject(raw);

			this.validateVariables(variables, filledVars);

			const prompt = this.fillPrompt(prompt_body, filledVars);

			return {
				prompt,
				variables: filledVars,
			};
		} catch (err) {
			console.error('[Consolidate.getContext.error]', err);

			if (err instanceof HttpException) {
				throw err;
			}

			throw new HttpException(
				'Failed to generate context',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	private validateVariables(
		requiredVariables: string[],
		generatedVariables: Record<string, string>,
	): void {
		const missingVariables = requiredVariables.filter(
			(variable) => !generatedVariables[variable],
		);

		if (missingVariables.length) {
			throw new HttpException(
				`Missing variables: ${missingVariables.join(', ')}`,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	private fillPrompt(
		template: string,
		variables: Record<string, string>,
	): string {
		let result = template;

		for (const [key, value] of Object.entries(variables)) {
			result = result.replaceAll(`{{${key}}}`, value);
		}

		return result;
	}

	private parseRawObject(raw: string): Record<string, string> {
		try {
			return JSON.parse(raw);
		} catch {
			throw new HttpException(
				'Memory service returned invalid JSON',
				HttpStatus.BAD_GATEWAY,
			);
		}
	}

	private async getRelevantMemory(
		userId: string,
		promptBody?: string,
		profileId?: string,
	): Promise<unknown[]> {
		const [
			proceduralMemory,
			contextProfile,
			semanticMemory,
			profileAgentMemory,
		] = await Promise.all([
			this.midbrain.getProcedural({ userId }),
			this.midbrain.getProfile({ userId }),
			promptBody
				? this.midbrain
						.search({
							userId,
							query: promptBody,
							limit: 5,
						})
						.catch((e: unknown): unknown[] => {
							console.error('[Consolidate.semantic.error]', e);
							return [];
						})
				: Promise.resolve([]),
			profileId
				? this.getProfileAgentMemory(userId, profileId, promptBody)
				: Promise.resolve([]),
		]);

		return [
			...(proceduralMemory?.items || []),
			contextProfile,
			...(semanticMemory as unknown[]),
			...profileAgentMemory,
		];
	}

	/**
	 * Additive context from the profile-scoped agent (separate memory
	 * namespace from the user's main agent), on top of the personal memory
	 * already gathered above.
	 */
	private async getProfileAgentMemory(
		userId: string,
		profileId: string,
		promptBody?: string,
	): Promise<unknown[]> {
		try {
			const [profileDescription, semanticMemory] = await Promise.all([
				this.midbrain.getProfile({ userId, profileId }),
				promptBody
					? this.midbrain
							.search({
								userId,
								profileId,
								query: promptBody,
								limit: 5,
							})
							.catch((e: unknown): unknown[] => {
								console.error(
									'[Consolidate.profileAgent.semantic.error]',
									e,
								);
								return [];
							})
					: Promise.resolve([]),
			]);

			return [
				profileDescription,
				...(semanticMemory as unknown[]),
			].filter(Boolean);
		} catch (e) {
			console.error('[Consolidate.profileAgent.error]', e);
			return [];
		}
	}

	private async getInjectionMemory(
		input: string,
		userId: string,
	): Promise<string> {
		const contextProfile = await this.midbrain.getProfile({ userId });

		return contextProfile?.description;
	}
}
