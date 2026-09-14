import { applyDecorators } from '@nestjs/common';
import {
	ApiOperation,
	ApiResponse,
	ApiBadRequestResponse,
	ApiConsumes,
	ApiBody,
} from '@nestjs/swagger';

export function ApiUpdatePrompt() {
	return applyDecorators(
		ApiOperation({ summary: 'Create or update a system prompt by key' }),
		ApiConsumes('multipart/form-data'),
		ApiBody({
			schema: {
				type: 'object',
				properties: {
					key: {
						type: 'string',
						enum: [
							'autocomplete',
							'summary',
							'tone_analyzer',
							'context_profile',
						],
					},
					file: { type: 'string', format: 'binary' },
				},
				required: ['key'],
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Prompt updated successfully',
		}),
		ApiBadRequestResponse({ description: 'Validation failed' }),
	);
}
