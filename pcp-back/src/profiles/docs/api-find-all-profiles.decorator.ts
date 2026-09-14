import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';

export function ApiFindAllProfiles() {
	return applyDecorators(
		ApiOperation({
			summary:
				'Get all Copilot profiles (ContextProfiles) for the authorized user',
		}),
		ApiResponse({
			status: 200,
			description: 'List of context profiles created by the user',
			schema: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							example: 'clz9ez2f83rk301r3a6v1gqkq',
						},
						type: {
							type: 'string',
							enum: ['business', 'personal', 'search'],
							example: 'business',
						},
						label: {
							type: 'string',
							enum: ['Text', 'Search'],
							description:
								'Short label for Dashboard - Context Profiles list',
							example: 'Text',
						},
						copilot_name: {
							type: 'string',
							example: 'Cold Outreach Assistant',
						},
						user_id: {
							type: 'string',
							example: '1c2f180c-78c8-4f39-b18a-cfbfe9d5e65c',
						},
						profile: {
							type: 'object',
							description: 'Flattened profile fields by type',
							example: {
								domain: 'technology',
								role: 'Full-stack Developer',
								primary_goal: 'Optimize performance',
								website: 'https://example.dev',
							},
						},
						glossary: {
							type: 'array',
							items: {
								type: 'object',
								required: ['term'],
								properties: {
									term: { type: 'string' },
									type: { type: 'string' },
									definition: { type: 'string' },
									ownership: { type: 'string' },
									context: { type: 'string' },
								},
							},
							example: [
								{
									term: 'Content calendar',
									type: 'process',
									definition: 'Planned content schedule',
									ownership: 'user',
									context: 'Used to plan weekly blog topics.',
								},
								{
									term: 'SEO',
									type: 'practice',
									definition: 'Search Engine Optimization',
									ownership: 'general',
									context:
										'Improves organic search visibility.',
								},
							],
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
						created_at: {
							type: 'string',
							format: 'date-time',
							example: '2025-08-05T17:30:00Z',
						},
						updated_at: {
							type: 'string',
							format: 'date-time',
							example: '2025-08-19T10:37:26Z',
						},
					},
				},
			},
		}),
		ApiUnauthorizedResponse(),
	);
}
