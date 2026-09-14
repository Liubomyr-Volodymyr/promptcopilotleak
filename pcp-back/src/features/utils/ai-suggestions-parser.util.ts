/**
 * Parses raw AI response into an array of suggestion strings.
 * Splits by newlines, trims each line, filters out empty strings, and limits the result count.
 *
 * @param raw - Raw AI response string (typically multiline)
 * @param limit - Maximum number of suggestions to return (default: 6)
 * @returns Array of parsed suggestion strings
 */
export function parseAiSuggestions(raw: string, limit = 6): string[] {
	return raw
		.split('\n')
		.map((s) => s.trim())
		.filter(Boolean)
		.slice(0, limit);
}
