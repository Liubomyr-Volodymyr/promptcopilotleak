import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiAdminHardDeleteUser() {
	return applyDecorators(
		ApiOperation({
			summary: 'Hard delete user',
			description: 'Hard delete for super admins',
		}),
		ApiParam({
			name: 'id',
			type: Number,
			example: 42,
			description: 'user id',
		}),
		ApiResponse({
			status: 200,
			description: 'User permanently deleted',
			schema: {
				example: {
					ok: true,
				},
			},
		}),
		ApiResponse({
			status: 403,
			description:
				'Forbidden — only super admins can perform hard delete',
		}),
		ApiResponse({
			status: 404,
			description: 'User not found',
		}),
	);
}
