import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiAutocompleteDocs() {
	return applyDecorators(
		ApiOperation({
			summary:
				'Autocomplete prompt using user profile, context, and memories',
		}),
		ApiQuery({
			name: 'profile_id',
			required: false,
			type: Number,
			description: 'Optional context profile ID',
		}),
		ApiQuery({
			name: 'input',
			required: true,
			type: String,
			description: 'Text to complete',
		}),
		ApiQuery({
			name: 'domain',
			required: false,
			type: String,
			description: 'Optional domain for context (URL)',
		}),
		ApiQuery({
			name: 'conversationId',
			required: false,
			type: String,
			description: 'Conversation ID (e.g. ChatGPT/Claude chat ID) to use chat-specific memory',
		}),
		ApiQuery({
			name: 'debug',
			required: false,
			type: String,
			description: 'Set to "true" to include memory debug info in response',
		}),
		ApiResponse({
			status: 200,
			description: 'Autocomplete result returned',
			schema: {
				example: {
					input: 'Write a landing page hero for...',
					suggestion:
						'Introducing your ultimate productivity tool...',
				},
			},
		}),
		ApiResponse({
			status: 400,
			description: 'Validation failed',
			schema: {
				example: {
					success: false,
					statusCode: 400,
					message: [
						'profile_id must be a number',
						'input should not be empty',
						'domain must be a URL address',
					],
				},
			},
		}),
	);
}
