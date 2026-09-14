import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiAdminListUsers() {
	return applyDecorators(
		ApiOperation({ summary: 'List users (admin)' }),
		ApiQuery({
			name: 'search',
			required: false,
			description: 'Filter by name or email',
			example: 'john',
		}),
		ApiQuery({
			name: 'role',
			required: false,
			description: 'Filter by role',
			example: 'user',
		}),
		ApiQuery({
			name: 'isVerified',
			required: false,
			description: 'Filter by verification status',
			example: true,
			type: Boolean,
		}),
		ApiQuery({
			name: 'page',
			required: false,
			description: 'Pagination page number (default: 1)',
			example: 1,
			type: Number,
		}),
		ApiQuery({
			name: 'limit',
			required: false,
			description: 'Items per page (default: 20)',
			example: 20,
			type: Number,
		}),
		ApiResponse({
			status: 200,
			description: 'List of users with pagination',
			schema: {
				example: {
					data: [
						{
							id: 1,
							firstName: 'John',
							lastName: 'Doe',
							email: 'john@example.com',
							role: 'user',
							isVerified: true,
							createdAt: '2025-10-22T10:00:00Z',
						},
						{
							id: 2,
							firstName: 'Alice',
							lastName: 'Smith',
							email: 'alice@example.com',
							role: 'admin',
							isVerified: false,
							createdAt: '2025-10-21T15:30:00Z',
						},
					],
					meta: {
						total: 2,
						page: 1,
						limit: 20,
					},
				},
			},
		}),
	);
}
