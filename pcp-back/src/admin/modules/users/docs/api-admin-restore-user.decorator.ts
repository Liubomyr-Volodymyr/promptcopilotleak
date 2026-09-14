import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiAdminRestoreUser() {
	return applyDecorators(
		ApiOperation({ summary: 'Restore soft-deleted user' }),
		ApiParam({
			name: 'id',
			description: 'User ID to restore',
			example: 15,
		}),
		ApiResponse({
			status: 200,
			description: 'User restored successfully',
			schema: {
				example: {
					message: 'User successfully restored',
					id: 15,
					restored: true,
				},
			},
		}),
		ApiResponse({
			status: 404,
			description: 'User not found or already active',
		}),
	);
}
