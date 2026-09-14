import Groq from 'groq-sdk';
import type { ChatResponse, ModelRequestOptions } from 'llm-api/dist/src/types';

type Init = { apiKey: string };
type Opts = {
	model: string;
	temperature?: number;
	maxTokens?: number;
	stream?: boolean;
	topP?: number;
	reasoningEffort?: 'low' | 'medium' | 'high';
};

export class GroqSdkChatApi {
	private client: Groq;
	private opts: Required<Omit<Opts, 'reasoningEffort'>> & {
		reasoningEffort?: Opts['reasoningEffort'];
	};

	constructor(init: Init, opts: Opts) {
		if (!init?.apiKey) throw new Error('GROQ_API_KEY is required');
		this.client = new Groq({ apiKey: init.apiKey });
		this.opts = {
			model: opts.model,
			temperature: opts.temperature ?? 0.25,
			maxTokens: opts.maxTokens,
			stream: opts.stream ?? false,
			topP: opts.topP ?? 1,
			reasoningEffort: opts.reasoningEffort,
		};
	}

	async textCompletion(
		prompt: string,
		message: string,
		req: ModelRequestOptions = {},
	): Promise<ChatResponse> {
		const stop = Array.isArray(req.stop)
			? req.stop
			: req.stop
				? [req.stop]
				: null;

		if (!this.opts.stream) {
			const r = await this.client.chat.completions.create({
				model: this.opts.model,
				messages: [
					{ role: 'system', content: prompt },
					{ role: 'user', content: message },
				],
				temperature: this.opts.temperature,
				max_completion_tokens:
					req.maximumResponseTokens ?? this.opts.maxTokens,
				top_p: this.opts.topP,
				stream: false,
			});

			const choice: any = (r as any)?.choices?.[0] ?? {};
			let text: string =
				(typeof choice?.message?.content === 'string' &&
					choice.message.content) ||
				(typeof choice?.text === 'string' && choice.text) ||
				'';
			if (!text?.trim()) {
				console.error(
					'[GroqSdkChatApi] Empty completion. Raw:',
					JSON.stringify(r, null, 2),
				);
			}

			text = text.replace(/^\s+/, '');

			return {
				content: text,
				message: choice?.message ?? null,
				usage: {
					totalTokens: r.usage.total_tokens,
					completionTokens: r.usage.completion_tokens,
					promptTokens: r.usage.prompt_tokens,
				},
				respond: () => {
					throw new Error('Respond not implemented');
				},
			};
		}

		const stream = await this.client.chat.completions.create({
			model: this.opts.model,
			messages: [{ role: 'user', content: prompt }],
			temperature: this.opts.temperature,
			max_completion_tokens:
				req.maximumResponseTokens ?? this.opts.maxTokens,
			top_p: this.opts.topP,
			stream: true,
			reasoning_effort: this.opts.reasoningEffort,
			stop,
		});

		let buf = '';
		for await (const chunk of stream) {
			const delta = chunk?.choices?.[0]?.delta?.content ?? '';
			if (delta) {
				buf += delta;
				req.events?.emit?.('delta', delta);
			}
		}
		return {
			content: buf,
			message: null,
			respond: () => {
				throw new Error('Respond not implemented');
			},
		};
	}
}
