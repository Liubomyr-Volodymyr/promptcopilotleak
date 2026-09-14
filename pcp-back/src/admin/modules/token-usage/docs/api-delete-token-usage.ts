import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteTokenUsage() {
	return applyDecorators(
		ApiOperation({ summary: 'Delete token usage record (admin)' }),
		ApiParam({ name: 'id', example: 12 }),
		ApiResponse({
			status: 200,
			description: 'Record successfully deleted',
		}),
		ApiResponse({ status: 404, description: 'Record not found' }),
	);
}
