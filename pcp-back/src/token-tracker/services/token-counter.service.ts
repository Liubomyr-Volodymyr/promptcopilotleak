import { Injectable, Logger } from '@nestjs/common';

export type TokenCount = {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	model: string;
};

@Injectable()
export class TokenCounterService {
	private readonly logger = new Logger(TokenCounterService.name);

	private encCache = new Map<string, any | null>();

	private tryGetEncodingForModel(model: string) {
		if (this.encCache.has(model)) return this.encCache.get(model);

		try {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const { encoding_for_model } = require('@dqbd/tiktoken');
			const enc = encoding_for_model(model);
			this.encCache.set(model, enc);
			return enc;
		} catch (err: any) {
			this.logger.debug(
				`tiktoken not available for model "${model}" or failed to init: ${err?.message ?? err}`,
			);
			this.encCache.set(model, null);
			return null;
		}
	}

	countText(model: string, promptText = '', completionText = ''): TokenCount {
		const enc = this.tryGetEncodingForModel(model);
		try {
			if (enc) {
				const p = enc.encode(promptText ?? '').length;
				const c = completionText
					? enc.encode(completionText).length
					: 0;
				return {
					promptTokens: p,
					completionTokens: c,
					totalTokens: p + c,
					model,
				};
			}
		} catch (err: any) {
			this.logger.debug(
				`tiktoken encode failed for model "${model}": ${err?.message ?? err}`,
			);
		}

		const approx = (s = '') =>
			Math.max(0, Math.round((s ?? '').length / 4));
		const p = approx(promptText);
		const c = approx(completionText);
		return {
			promptTokens: p,
			completionTokens: c,
			totalTokens: p + c,
			model,
		};
	}
}
