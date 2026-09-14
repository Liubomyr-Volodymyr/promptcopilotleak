export class PromptBuilder {
	private blocks: string[] = [];

	addTitle(title: string): this {
		this.blocks.push(`${title}`);
		return this;
	}

	addBlock<T = unknown>(
		title: string,
		content: T | T[] | null | undefined,
		formatter?: (value: T | T[]) => string,
	): this {
		if (content == null) return this;
		let text = '';

		if (formatter) {
			text = formatter(content);
		} else if (Array.isArray(content)) {
			text = (content as any[])
				.map((v) => {
					if (typeof v === 'string') return v.trim();
					if (typeof v === 'object' && v !== null)
						return Object.entries(v)
							.map(([key, value]) => `- ${key}: ${value}\n`)
							.join(' ');
					return String(v);
				})
				.join('\n')
				.trim();
		} else if (typeof content === 'object') {
			text = Object.entries(content)
				.map(([key, value]) => (value ? `- ${key}: ${value}\n` : ''))
				.join('')
				.trim();
		} else if (typeof content === 'string') {
			text = content.trim();
		} else {
			text = String((content as any) ?? '').trim();
		}

		if (!text) return this;
		this.blocks.push(`${title}:\n${text}`);
		return this;
	}

	build(): string {
		return this.blocks
			.map((b) => b.trim())
			.filter((b) => b.length > 0)
			.join('\n\n')
			.trim();
	}
}
