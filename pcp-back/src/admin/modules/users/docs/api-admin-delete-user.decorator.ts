import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function ApiAdminDeleteUser() {
	return applyDecorators(
		ApiOperation({
			summary: 'Soft delete user',
			description: 'Delete user (soft delete)',
		}),
		ApiParam({
			name: 'id',
			type: Number,
			example: 12,
			description: 'user id',
		}),
		ApiResponse({
			status: 200,
			description: 'User successfully soft deleted',
			schema: {
				example: {
					ok: true,
				},
			},
		}),
		ApiResponse({
			status: 401,
			description: 'Unauthorized — missing or invalid admin JWT token',
		}),
		ApiResponse({
			status: 404,
			description: 'User not found or already deleted',
		}),
	);
}
