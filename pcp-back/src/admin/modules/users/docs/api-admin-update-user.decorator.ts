import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UpdateUserDto } from '../dto';

export function ApiAdminUpdateUser() {
	return applyDecorators(
		ApiOperation({
			summary: 'Update user',
			description: 'Update user by ID.',
		}),
		ApiParam({
			name: 'id',
			type: Number,
			example: 7,
			description: 'update by user id',
		}),
		ApiBody({
			type: UpdateUserDto,
			examples: {
				default: {
					summary: 'Example payload',
					value: {
						firstName: 'Updated',
						lastName: 'User',
						role: 'admin',
						isVerified: true,
					},
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'User successfully updated',
			schema: {
				example: {
					id: 7,
					firstName: 'Updated',
					lastName: 'User',
					email: 'updated@example.com',
					role: 'admin',
					isVerified: true,
					updatedAt: '2025-10-22T09:00:00Z',
				},
			},
		}),
		ApiResponse({
			status: 404,
			description: 'User not found',
		}),
		ApiResponse({
			status: 400,
			description: 'Validation error',
		}),
	);
}
