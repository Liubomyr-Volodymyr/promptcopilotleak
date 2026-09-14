import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiAdminGetUser() {
	return applyDecorators(
		ApiOperation({
			summary: 'Get user by ID',
			description: 'Get info about user by ID',
		}),
		ApiParam({
			name: 'id',
			type: Number,
			example: 1,
			description: 'user id',
		}),
		ApiResponse({
			status: 200,
			description: 'User found',
			schema: {
				example: {
					id: 1,
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					role: 'user',
					isVerified: true,
					createdAt: '2025-10-22T09:00:00Z',
					updatedAt: '2025-10-22T09:00:00Z',
				},
			},
		}),
		ApiResponse({
			status: 404,
			description: 'User not found',
		}),
	);
}
