import { ChatResponse } from 'llm-api/dist/src/types';

export class OpenRouterChatApi {
	private apiKey: string;
	private baseUrl = 'https://openrouter.ai/api/v1';

	constructor(
		{ apiKey }: { apiKey: string },
		private options: {
			model: string;
			stream?: boolean;
			temperature?: number;
			maxTokens?: number;
			rawCompletion?: boolean;
		},
	) {
		this.apiKey = apiKey;
	}

	async textCompletion(
		prompt: string,
		message?: string,
		extra?: any,
	): Promise<ChatResponse & { cost: number }> {
		const isRaw = this.options.rawCompletion;

		const endpoint = isRaw
			? `${this.baseUrl}/completions`
			: `${this.baseUrl}/chat/completions`;

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: this.options.model,
				...(isRaw
					? {
							prompt: message ?? prompt,
							provider: {
								order: ['Together', 'Fireworks', 'DeepInfra'],
								// Prevent fallback to SiliconFlow — it enables thinking mode
								// which returns reasoning instead of text, breaking completions.
								allow_fallbacks: false,
							},
						}
					: {
							messages: [
								{ role: 'system', content: prompt },
								...(message
									? [{ role: 'user', content: message }]
									: []),
							],
						}),
				temperature: this.options.temperature,
				max_tokens:
					this.options.maxTokens ?? extra?.maximumResponseTokens,
				stream: this.options.stream ?? false,
				stop: extra?.stop,
			}),
		});

		const data = await response.json();

		console.log('[OpenRouter RAW] status:', response.status, 'data:', JSON.stringify(data).slice(0, 300));

		const metaResp = await fetch(
			`${this.baseUrl}/generation?id=${data.id}`,
			{ headers: { Authorization: `Bearer ${this.apiKey}` } },
		);
		const metaData = await metaResp.json();
		const total_cost = metaData?.data?.total_cost ?? 0;

		const content =
			data.choices?.[0]?.text ??
			data.choices?.[0]?.message?.content ??
			'';

		return {
			content,
			message: data.choices?.[0]?.message ?? {
				role: 'assistant',
				content,
			},
			cost: total_cost,
			respond: () => {
				throw new Error('Respond not implemented');
			},
		};
	}
}
