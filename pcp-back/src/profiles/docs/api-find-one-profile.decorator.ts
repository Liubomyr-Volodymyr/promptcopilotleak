import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';

export function ApiFindOneProfile() {
	return applyDecorators(
		ApiOperation({
			summary: 'Get a single Copilot context profile by ID',
		}),
		ApiParam({
			name: 'id',
			description: 'ID of the Copilot profile',
			required: true,
			schema: { type: 'string', example: 'clz9ez2f83rk301r3a6v1gqkq' },
		}),
		ApiResponse({
			status: 200,
			description: 'Full context profile configuration',
			schema: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
						example: '123',
					},
					type: {
						type: 'string',
						enum: ['business', 'personal', 'search'],
						example: 'business',
					},
					label: {
						type: 'string',
						enum: ['Text - Work', 'Text - Personal', 'Search'],
						description:
							'Full label for Dashboard - Profile Detailed pop-up',
						example: 'Text - Work',
					},
					copilot_name: {
						type: 'string',
						example: 'Cold Outreach Assistant',
					},
					profile: {
						type: 'object',
						description:
							'Profile data structure varies by type. For business: domain (Work Area), role, primary_goal, company_description, relevant_link. For personal: theme (Area of life), role, primary_goal, relevant_link.',
						example: {
							domain: 'technology',
							role: 'Full-stack Developer',
							primary_goal: 'Optimize performance',
							company_description:
								'A technology company focused on...',
							relevant_link: 'https://example.dev',
						},
					},
					style_tone: {
						type: 'array',
						items: {
							type: 'object',
							required: ['tone'],
							properties: {
								tone: { type: 'string' },
							},
						},
						example: [{ tone: 'formal' }, { tone: 'playful' }],
					},
					user_id: { type: 'string', example: 'user-456' },
					created_at: {
						type: 'string',
						format: 'date-time',
						example: '2025-08-05T17:30:00Z',
					},
				},
			},
		}),
		ApiUnauthorizedResponse(),
		ApiResponse({
			status: 403,
			description:
				'Access denied. The profile does not belong to the current user.',
		}),
		ApiResponse({
			status: 404,
			description: 'Profile not found',
		}),
	);
}
