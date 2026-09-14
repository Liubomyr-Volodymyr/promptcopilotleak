import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiAdminTokenUsageStats() {
	return applyDecorators(
		ApiOperation({
			summary: 'Quick totals (alias for list with groupBy=none)',
		}),
		ApiQuery({ name: 'userId', required: false, example: 'user_123' }),
		ApiQuery({ name: 'model', required: false, example: 'gpt-4-turbo' }),
		ApiResponse({
			status: 200,
			description: 'Totals of token usage',
			schema: {
				example: {
					totalPromptTokens: 1024,
					totalCompletionTokens: 256,
					totalTokens: 1280,
				},
			},
		}),
	);
}
