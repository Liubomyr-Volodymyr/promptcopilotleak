import { OpenAIChatApi, AnthropicChatApi, GroqChatApi } from 'llm-api'; // First position (Do not change it)
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { LLModel, PROJECT_KEY } from '../../common/enums';

import { AssistantService } from '../services/assistant.service';
import { CONFIG } from '../../config/enums';
import { GroqSdkChatApi } from './groq-sdk-chat.api';
import { OpenRouterChatApi } from './open-router.api';
import { GeminiChatApi } from './gemini-chat.api';
import { MidbrainLLMProxyApi } from './midbrain-llm-proxy.api';

@Injectable()
export class AiClientFactory {
	constructor(
		private readonly configService: ConfigService,
		private readonly assistantService: AssistantService,
	) {}

	private mergeDefaults(options: any, defaults: any) {
		return {
			stream: options?.stream ?? defaults.stream ?? false,
			temperature: options?.temperature ?? defaults.temperature ?? 0.2,
			maxTokens: options?.maxTokens ?? defaults.maxTokens,
			stop: options?.stop,
			topP: options?.topP ?? defaults.topP,
		};
	}

	create(
		model: LLModel,
		project_key?: PROJECT_KEY,
		agent_key?: string,
		options: any = {},
	) {
		switch (model) {
			// ---- Assistants
			case LLModel.ENHANCE_ASSISTANT:
			case LLModel.GLOSSARY_ASSISTANT: {
				const assistantId = model;
				return {
					textCompletion: async (prompt: string) => {
						const res =
							await this.assistantService.getAssistantResponse({
								assistantId,
								prompt: JSON.stringify(prompt),
								project_key,
							});
						return typeof res === 'string' ? { content: res } : res;
					},
				};
			}

			// ---- Anthropic
			case LLModel.CLAUDE_35_SONNET:
			case LLModel.CLAUDE_35_HAIKU:
			case LLModel.CLAUDE_3_OPUS: {
				const merged = this.mergeDefaults(options, {
					temperature: 0.3,
				});
				return new AnthropicChatApi(
					{ apiKey: process.env.ANTHROPIC_API_KEY },
					{
						model,
						stream: merged.stream,
						temperature: merged.temperature,
						maxTokens: merged.maxTokens,
					},
				);
			}

			// ---- OpenAI
			case LLModel.GPT_4O:
			case LLModel.GPT_4_TURBO:
			case LLModel.GPT_35_TURBO: {
				const merged = this.mergeDefaults(options, {
					temperature: 0.2,
				});
				return new OpenAIChatApi(
					{ apiKey: process.env.OPENAI_CUSTOM_API_KEY },
					{
						model,
						stream: merged.stream,
						temperature: merged.temperature,
						maxTokens: merged.maxTokens,
					},
				);
			}

			// ---- Gemini
			case LLModel.GEMINI_FLASH:
			case LLModel.GEMINI_FLASH_LITE:
			case LLModel.GEMINI_PRO: {
				const merged = this.mergeDefaults(options, {
					temperature: 0.2,
				});
				return new GeminiChatApi(
					{ apiKey: process.env.GEMINI_API_KEY },
					{
						model,
						stream: merged.stream,
						temperature: merged.temperature,
						maxTokens: merged.maxTokens,
					},
				);
			}

			// ---- Groq (REST)
			case LLModel.GROQ_LLAMA_70B:
			case LLModel.GROQ_LLAMA_8B:
			case LLModel.GROQ_MIXTRAL:
			case LLModel.GROQ_GEMMA_9B: {
				const merged = this.mergeDefaults(options, {
					temperature: 0.2,
				});
				return new GroqChatApi(
					{ apiKey: this.configService.get(CONFIG.GROQ_API_KEY) },
					{
						model,
						stream: merged.stream,
						temperature: merged.temperature,
						maxTokens: merged.maxTokens,
					},
				);
			}

			// ---- OpenRouter: Qwen base model for pure completion (autocomplete)
			case LLModel.OPENROUTER_QWEN_BASE: {
				const merged = this.mergeDefaults(options, {
					maxTokens: 80,
				});
				return new OpenRouterChatApi(
					{
						apiKey: this.configService.get(
							CONFIG.OPENROUTER_API_KEY,
						),
					},
					{
						model,
						stream: merged.stream,
						temperature: undefined,
						maxTokens: merged.maxTokens,
						rawCompletion: true,
					},
				);
			}

			case LLModel.OPENROUTER_QWEN_CODER: {
				const merged = this.mergeDefaults(options, {
					temperature: 0.4,
					maxTokens: 40,
				});
				return new OpenRouterChatApi(
					{
						apiKey: this.configService.get(
							CONFIG.OPENROUTER_API_KEY,
						),
					},
					{
						model,
						stream: merged.stream,
						temperature: merged.temperature,
						maxTokens: merged.maxTokens,
					},
				);
			}

			// ---- OpenRouter
			case LLModel.OPENROUTER_GPT_4O:
			case LLModel.OPENROUTER_LLAMA_70B:
			case LLModel.OPENROUTER_GPT:
			case LLModel.OPENROUTER_GPT_4O_MINI:
			case LLModel.OPENROUTER_QWEN:
			case LLModel.OPENROUTER_QWEN_CODER_7B: {
				const merged = this.mergeDefaults(options, {
					temperature: 0.4,
				});
				return new OpenRouterChatApi(
					{
						apiKey: this.configService.get(
							CONFIG.OPENROUTER_API_KEY,
						),
					},
					{
						model,
						stream: merged.stream,
						temperature: merged.temperature,
						maxTokens: merged.maxTokens,
					},
				);
			}

			// ---- Groq SDK (stream SDK)
			case LLModel.GROQ_OSS: {
				const merged = this.mergeDefaults(options, {
					temperature: 0.3,
					topP: 1,
				});
				return new GroqSdkChatApi(
					{ apiKey: this.configService.get(CONFIG.GROQ_API_KEY)! },
					{
						model,
						temperature: merged.temperature,
						stream: merged.stream,
						topP: merged.topP,
					},
				);
			}

			// ---- Midbrain
			case LLModel.MIDBRAIN_GPT_4O:
			case LLModel.MIDBRAIN_GPT_5:
			case LLModel.MIDBRAIN_GROQ_OSS: {
				const merged = this.mergeDefaults(options, {
					temperature: 0.2,
				});

				return new MidbrainLLMProxyApi(
					{ apiKey: agent_key },
					{
						model,
						temperature: merged.temperature,
						stream: merged.stream,
						maxTokens: merged.maxTokens,
					},
				);
			}

			default:
				throw new Error(`Unsupported model: ${model}`);
		}
	}
}
