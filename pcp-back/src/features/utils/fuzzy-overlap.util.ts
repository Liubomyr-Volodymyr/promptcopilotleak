/**
 * Calculates Levenshtein distance between two strings with an early exit optimization.
 * Returns limit + 1 if the distance exceeds the limit to avoid unnecessary computation.
 *
 * @param a - First string
 * @param b - Second string
 * @param limit - Maximum allowed distance before early exit
 * @returns The Levenshtein distance, or limit + 1 if exceeded
 */
export function levenshteinLimit(a: string, b: string, limit: number): number {
	const na = a.length;
	const nb = b.length;
	if (Math.abs(na - nb) > limit) return limit + 1;
	if (na === 0) return nb;
	if (nb === 0) return na;
	const prev = new Uint16Array(nb + 1);
	const curr = new Uint16Array(nb + 1);
	for (let j = 0; j <= nb; j++) prev[j] = j;
	for (let i = 1; i <= na; i++) {
		curr[0] = i;
		let minRow = curr[0];
		const ai = a.charCodeAt(i - 1);
		for (let j = 1; j <= nb; j++) {
			const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
			const v = Math.min(
				prev[j] + 1,
				curr[j - 1] + 1,
				prev[j - 1] + cost,
			);
			curr[j] = v;
			if (v < minRow) minRow = v;
		}
		if (minRow > limit) return limit + 1;
		prev.set(curr);
	}
	return prev[nb];
}

/**
 * Options for fuzzy overlap calculation
 */
export interface FuzzyOverlapOptions {
	/** Maximum length to check for overlap (default: 150) */
	maxCheck?: number;
	/** Minimum length to check for overlap (default: 1) */
	minCheck?: number;
	/** Maximum absolute edit distance allowed (default: 4) */
	maxAbsEdits?: number;
	/** Relative threshold for edit distance (default: 0.3) */
	relThreshold?: number;
}

/**
 * Calculates the fuzzy overlap between input and full text using Levenshtein distance.
 * Finds the longest overlapping substring between the end of input and the beginning of full text,
 * allowing for small edit differences (typos, spacing, etc.).
 *
 * This function is used to determine how much of the input text already appears in the suggested completion,
 * so that only the remaining portion needs to be suggested.
 *
 * @param input - The user's input text
 * @param full - The full suggested completion text
 * @param opts - Optional configuration for overlap calculation
 * @returns The character position in the original full string where the overlap ends
 */
export function calcOverlapFuzzy(
	input: string,
	full: string,
	opts?: FuzzyOverlapOptions,
): number {
	const {
		maxCheck = 150,
		minCheck = 1,
		maxAbsEdits = 4,
		relThreshold = 0.3,
	} = opts ?? {};

	const normalize = (s: string) =>
		s.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
	const inp = normalize(input);
	const ful = normalize(full);

	// Early exit if full text starts with input (exact match)
	if (ful.startsWith(inp)) {
		return input.length;
	}

	// Validate word boundaries for short inputs
	if (inp.length > 0 && ful.length > 0) {
		const checkLength = Math.min(2, inp.length, ful.length);
		if (checkLength > 0) {
			const lastCharsOfInput = inp.slice(-checkLength);
			const firstCharsOfFull = ful.slice(0, checkLength);
			if (
				lastCharsOfInput !== firstCharsOfFull &&
				!lastCharsOfInput.endsWith(' ') &&
				!firstCharsOfFull.startsWith(' ')
			) {
				const inputWords = inp.split(/\s+/).filter(Boolean);
				const fullWords = ful.split(/\s+/).filter(Boolean);
				if (inputWords.length > 0 && fullWords.length > 0) {
					const lastWord = inputWords[inputWords.length - 1];
					const firstWord = fullWords[0];
					if (
						lastWord !== firstWord &&
						!firstWord.startsWith(lastWord) &&
						!lastWord.startsWith(firstWord)
					) {
						const hasMultiWordOverlap = inputWords.some(
							(w) =>
								w === firstWord ||
								firstWord.startsWith(w) ||
								w.startsWith(firstWord),
						);
						if (!hasMultiWordOverlap) {
							return 0;
						}
					}
				} else {
					return 0;
				}
			}
		}
	}

	// Find best overlap using fuzzy matching
	const maxPossible = Math.min(maxCheck, inp.length, ful.length);
	let bestOverlap = 0;
	let bestScore = Infinity;
	for (let k = maxPossible; k >= minCheck; k--) {
		const suf = inp.slice(-k);
		const pref = ful.slice(0, k);
		const relLimit = Math.max(1, Math.floor(k * relThreshold));
		const limit = Math.min(maxAbsEdits, Math.max(relLimit, 1));
		const edits = levenshteinLimit(suf, pref, limit);
		const score = edits / k;
		if (score < bestScore && edits <= limit) {
			bestScore = score;
			bestOverlap = k;
		}
	}

	// Reject matches with too high error rate
	if (bestScore > 0.5) {
		return 0;
	}

	// Additional word boundary validation
	if (bestOverlap > 0 && !ful.startsWith(inp)) {
		const inputWords = inp.split(/\s+/).filter(Boolean);
		const fullWords = ful.split(/\s+/).filter(Boolean);
		if (inputWords.length > 0 && fullWords.length > 0) {
			const lastWord = inputWords[inputWords.length - 1];
			const firstWord = fullWords[0];
			if (
				lastWord !== firstWord &&
				!firstWord.startsWith(lastWord) &&
				!lastWord.startsWith(firstWord) &&
				bestOverlap < lastWord.length
			) {
				return 0;
			}
		}
	}

	// If overlap is very high, return full input length
	if (bestOverlap >= inp.length * 0.85) {
		return input.length;
	}

	// Reject very short overlaps with errors
	if (bestOverlap < 3 && bestScore > 0) {
		return 0;
	}

	// Map normalized overlap back to original string position
	if (bestOverlap > 0) {
		const normalizedPrefix = ful.slice(0, bestOverlap);
		for (let i = 0; i <= full.length; i++) {
			const testNormalized = normalize(full.slice(0, i));
			if (testNormalized === normalizedPrefix) {
				return i;
			}
			if (testNormalized.length > bestOverlap) {
				break;
			}
		}
		for (let i = 0; i <= full.length; i++) {
			const testNormalized = normalize(full.slice(0, i));
			if (testNormalized.length >= bestOverlap) {
				if (testNormalized.slice(0, bestOverlap) === normalizedPrefix) {
					return i;
				}
			}
		}
		return bestOverlap;
	}
	return bestOverlap;
}
