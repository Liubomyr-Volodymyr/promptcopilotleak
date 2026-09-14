import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { TokenUsage } from '../../../../token-tracker/entities/token-usage.entity';

export function ApiAdminTokenUsageList() {
	return applyDecorators(
		ApiOperation({ summary: 'List token usage and totals' }),
		ApiQuery({ name: 'userId', required: false, example: 'user_123' }),
		ApiQuery({ name: 'model', required: false, example: 'gpt-4-turbo' }),
		ApiQuery({ name: 'groupBy', required: false, example: 'user' }),
		ApiQuery({ name: 'page', required: false, example: 1 }),
		ApiQuery({ name: 'limit', required: false, example: 20 }),
		ApiResponse({
			status: 200,
			description: 'List of token usage records',
			type: [TokenUsage],
			schema: {
				example: [
					{
						id: 1,
						userId: 'user_123',
						model: 'gpt-4-turbo',
						promptTokens: 512,
						completionTokens: 120,
						totalTokens: 632,
						createdAt: '2025-10-22T09:30:00Z',
					},
				],
			},
		}),
	);
}
