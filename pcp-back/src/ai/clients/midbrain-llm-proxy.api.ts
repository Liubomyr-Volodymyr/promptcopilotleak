import axios, { AxiosInstance } from 'axios';
import type { ChatResponse, ModelRequestOptions } from 'llm-api/dist/src/types';

type Init = {
	apiKey: string; // agent key
};

type Opts = {
	model: string;
	stream: boolean;
	baseURL?: string;
	temperature?: number;
	maxTokens?: number;
	topP?: number;
};

export class MidbrainLLMProxyApi {
	private client: AxiosInstance;

	private opts: Opts;

	constructor(init: Init, opts: Opts) {
		if (!init.apiKey) {
			throw new Error('MIDBRAIN_API_KEY or agent key is required');
		}

		this.client = axios.create({
			baseURL: opts.baseURL ?? 'https://memory.midbrain.ai/v1',
			headers: {
				Authorization: `Bearer ${init.apiKey}`,
				'Content-Type': 'application/json',
			},
			timeout: 30000,
		});

		this.opts = {
			model: opts.model,
			temperature: opts.temperature ?? 0.25,
			maxTokens: opts.maxTokens,
			stream: opts.stream ?? false,
			topP: opts.topP ?? 1,
		};
	}

	async textCompletion(
		prompt: string,
		message: string,
		req: ModelRequestOptions = {},
	): Promise<ChatResponse> {
		try {
			const stop = Array.isArray(req.stop)
				? req.stop
				: req.stop
					? [req.stop]
					: undefined;

			const { data } = await this.client.post('/chat/completions', {
				model: this.opts.model,
				messages: [
					{
						role: 'system',
						content: prompt,
					},
					{
						role: 'user',
						content: message,
					},
				],
				temperature: this.opts.temperature,
				max_tokens: req.maximumResponseTokens ?? this.opts.maxTokens,
				top_p: this.opts.topP,
				stop,
				stream: false,
			});

			const choice = data?.choices?.[0];

			const content = choice?.message?.content?.trimStart() ?? '';

			return {
				content,
				message: choice?.message ?? null,
				usage: {
					totalTokens: data?.usage?.total_tokens,
					completionTokens: data?.usage?.completion_tokens,
					promptTokens: data?.usage?.prompt_tokens,
				},
				respond: () => {
					throw new Error('Respond not implemented');
				},
			};
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw new Error(
					`Midbrain request failed: ${
						error.response?.data?.error?.message ?? error.message
					}`,
				);
			}

			throw error;
		}
	}
}
