export const generateFileSummaryPrompt = (parsedText: string): string => {
	return `
You are an assistant that analyzes the provided file content and produces a concise summary for context understanding.

Your ENTIRE reply must be ONLY valid JSON with no extra text or formatting.

Return exactly one JSON object that matches the following structure:
{
  "content_type": "document" | "presentation" | "webpage" | "other",
  "language": "<ISO 639-1 two-letter lowercase code, e.g., 'en' or 'uk'>",
  "title": "<short descriptive title, max 100 characters>",
  "summary": "<concise 1-3 sentence summary>"
}

Guidelines:
- "content_type":
    - document → text-based materials, reports, articles, PDFs, DOCX
    - presentation → slides (PPT, Google Slides)
    - webpage → HTML or online articles
    - other → anything else
- "language" must be detected from the content and use ISO 639-1 two-letter lowercase code.
- "title" should be short, descriptive, and relevant to the content.
- "summary" should capture the main point(s) of the file in 1–3 sentences.
- Do not include any explanations, notes, or extra text outside the JSON.

File Content:
---
${parsedText}
---
	`.trim();
};
