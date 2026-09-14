export class LlmJsonError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'LlmJsonError';
	}
}

export function extractFirstJsonBlock(text: string): string {
	if (!text) throw new LlmJsonError('Empty response');

	// 1) replace markdown-codeblocks ```json ... ```
	const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fence?.[1]) return fence[1].trim();

	// 2) backticks
	let s = text
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, "'")
		.replace(/```/g, '');

	// 3) search char { or [
	const start = s.search(/[\[{]/);
	if (start === -1) throw new LlmJsonError('No JSON start token found');
	s = s.slice(start);

	// 4) extract ({} and [])
	const end = findBalancedJsonEndIndex(s);
	if (end === -1) throw new LlmJsonError('Unbalanced JSON braces/brackets');
	const candidate = s.slice(0, end + 1).trim();

	return candidate;
}

function findBalancedJsonEndIndex(s: string): number {
	const stack: string[] = [];
	let inStr = false;
	let esc = false;

	for (let i = 0; i < s.length; i++) {
		const ch = s[i];

		if (inStr) {
			if (esc) {
				esc = false;
				continue;
			}
			if (ch === '\\') {
				esc = true;
				continue;
			}
			if (ch === '"') inStr = false;
			continue;
		}

		if (ch === '"') {
			inStr = true;
			continue;
		}

		if (ch === '{' || ch === '[') stack.push(ch);
		else if (ch === '}' || ch === ']') {
			const open = stack.pop();
			if (!open) return -1;
			if (open === '{' && ch !== '}') return -1;
			if (open === '[' && ch !== ']') return -1;

			if (stack.length === 0) return i;
		}
	}
	return -1;
}

export function safeJsonParse<T = unknown>(raw: string): T {
	try {
		return JSON.parse(raw) as T;
	} catch {
		const fixed = raw
			.replace(/([^\\])'/g, '$1"') // ' → "
			.replace(/,\s*([}\]])/g, '$1'); // trailing commas
		return JSON.parse(fixed) as T;
	}
}
