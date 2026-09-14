import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from '../dto';

export function ApiAdminCreateUser() {
	return applyDecorators(
		ApiOperation({
			summary: 'Create new user',
			description: 'Create new user',
		}),
		ApiBody({
			type: CreateUserDto,
			examples: {
				default: {
					summary: 'Example payload',
					value: {
						firstName: 'Jane',
						lastName: 'Doe',
						email: 'jane.doe@example.com',
						role: 'user',
						isVerified: true,
					},
				},
			},
		}),
		ApiResponse({
			status: 201,
			description: 'User successfully created',
			schema: {
				example: {
					id: 5,
					firstName: 'Jane',
					lastName: 'Doe',
					email: 'jane.doe@example.com',
					role: 'user',
					isVerified: true,
					createdAt: '2025-10-22T09:00:00Z',
					updatedAt: '2025-10-22T09:00:00Z',
				},
			},
		}),
		ApiResponse({
			status: 400,
			description: 'Validation error or duplicate email',
		}),
	);
}
