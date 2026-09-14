export function generatePreviewTonePrompt(profile: any): string {
	return `
You are a style and tone generator. 
Based on the following user profile, suggest possible style/tone option.

Profile (YAML):
---
${JSON.stringify(profile, null, 2)}
---

## Rules
- Output ONLY valid JSON.
- JSON must be an array of objects.
- Each object must follow this shape:
  { "tone": "<string>" }
- Suggest 1 options.
- Do not include explanations, comments, or extra text.

## Example Output
[
  { "tone": "formal" },
]

Now generate tones for the profile above.
`;
}
