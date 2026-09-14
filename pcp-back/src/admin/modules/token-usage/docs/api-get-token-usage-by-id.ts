import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { TokenUsage } from '../../../../token-tracker/entities/token-usage.entity';

export function ApiGetTokenUsageById() {
	return applyDecorators(
		ApiOperation({ summary: 'Get token usage record by ID' }),
		ApiParam({ name: 'id', example: 1 }),
		ApiResponse({
			status: 200,
			description: 'Token usage record found',
			type: TokenUsage,
			schema: {
				example: {
					id: 1,
					userId: 'user_123',
					model: 'gpt-4-turbo',
					promptTokens: 512,
					completionTokens: 120,
					totalTokens: 632,
					createdAt: '2025-10-22T09:30:00Z',
				},
			},
		}),
		ApiResponse({ status: 404, description: 'Record not found' }),
	);
}
