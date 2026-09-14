import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiEnhanceDocs() {
	return applyDecorators(
		ApiOperation({
			summary: 'Generate an enhanced LLM-ready prompt',
			description: `
Enhances, rewrites, and enriches user input using memory, personal and contextual profile, improving the prompt.

Returns a structured prompt optimized for leading LLM providers, including:

- \`ChatGPT\`
- \`Gemini\`
- \`Claude\`
- \`Perplexity\`

The generated prompt improves response quality, relevance, and personalization by incorporating profile-specific context.
`,
		}),
		ApiQuery({ name: 'profile_id', required: false, type: Number }),
		ApiQuery({ name: 'input', required: true, type: String }),
		ApiQuery({ name: 'domain', required: false, type: String }),
		ApiResponse({
			status: 200,
			description: 'Returns enhanced version of the input',
			schema: {
				example: {
					input: 'Improve onboarding experience',
					suggestion:
						'Streamline your client onboarding with automated flows and personalized steps.',
				},
			},
		}),
		ApiResponse({
			status: 400,
			description: 'Validation error',
			schema: {
				example: {
					statusCode: 400,
					message: ['input must not be empty'],
				},
			},
		}),
	);
}
