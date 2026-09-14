import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from '../dto';

export function ApiRegister() {
	return applyDecorators(
		ApiOperation({ summary: 'Register a new user' }),
		ApiBody({
			type: RegisterDto,
			examples: {
				default: {
					summary: 'Example registration payload',
					value: {
						first_name: 'John',
						last_name: 'Doe',
						email: 'john.doe@example.com',
						password: 'Password123',
					},
				},
			},
		}),
		ApiResponse({
			status: 201,
			description: 'User successfully registered',
			schema: {
				example: {
					id: 'id',
					first_name: 'John',
					last_name: 'Doe',
					email: 'john.doe@example.com',
					created_at: '2025-07-04T12:00:00Z',
				},
			},
		}),
		ApiResponse({
			status: 400,
			description: 'Validation failed or bad request',
		}),
	);
}
