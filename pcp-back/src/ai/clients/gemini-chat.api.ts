import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import {
	ChatResponse,
	ModelConfig,
	ModelRequestOptions,
} from 'llm-api/dist/src/types';
import { LLModel } from '../../common/enums';

interface GeminiChatApiConfig {
	apiKey: string;
}

interface GeminiChatOptions extends Partial<ModelConfig> {
	model?: string;
}

export class GeminiChatApi {
	private readonly model: GenerativeModel;
	private readonly defaults: Required<
		Pick<ModelConfig, 'temperature' | 'maxTokens' | 'topP' | 'stream'>
	>;

	constructor(
		private readonly config: GeminiChatApiConfig,
		private readonly options: GeminiChatOptions = {},
	) {
		if (!config.apiKey) {
			throw new Error('Google Generative AI API key is required');
		}

		const genAI = new GoogleGenerativeAI(this.config.apiKey);
		const modelName = this.options.model || LLModel.GEMINI_FLASH_LITE;

		this.defaults = {
			temperature: this.options.temperature ?? 0.3,
			maxTokens: this.options.maxTokens,
			topP: this.options.topP ?? 0.9,
			stream: this.options.stream ?? false,
		};

		this.model = genAI.getGenerativeModel({
			model: modelName,
			generationConfig: {
				temperature: this.defaults.temperature,
				topP: this.defaults.topP,
				maxOutputTokens: this.defaults.maxTokens,
			},
		});
	}
	async textCompletion(
		prompt: string,
		reqOpts: ModelRequestOptions = {},
	): Promise<ChatResponse> {
		if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
			throw new Error('Prompt must be a non-empty string');
		}

		const maxOut = reqOpts.maximumResponseTokens ?? this.defaults.maxTokens;
		const temperature = this.defaults.temperature;
		const topP = this.defaults.topP;

		const stopSequences = Array.isArray(reqOpts.stop)
			? reqOpts.stop
			: reqOpts.stop
				? [reqOpts.stop]
				: undefined;
		try {
			if (this.defaults.stream) {
				const stream = await this.model.generateContentStream({
					contents: [{ role: 'user', parts: [{ text: prompt }] }],
					generationConfig: {
						temperature,
						topP,
						maxOutputTokens: maxOut,
						stopSequences,
					},
				});

				let buf = '';
				for await (const chunk of stream.stream) {
					const t =
						chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
					if (t) {
						buf += t;
						reqOpts.events?.emit('delta', t);
					}
				}

				return {
					content: buf,
					message: null,
					respond: () => {
						throw new Error('Respond method not implemented');
					},
				};
			}

			const result = await this.model.generateContent({
				contents: [{ role: 'user', parts: [{ text: prompt }] }],
				generationConfig: {
					temperature,
					topP,
					maxOutputTokens: maxOut,
					stopSequences,
				},
			});

			const text = result.response.text();

			return {
				content: text,
				message: null,
				respond: () => {
					throw new Error('Respond method not implemented');
				},
			};
		} catch (err: any) {
			console.error(
				'[GeminiChatApi] Failed to generate content:',
				err?.message || err,
			);
			throw new Error('Gemini model failed to generate content');
		}
	}
}
