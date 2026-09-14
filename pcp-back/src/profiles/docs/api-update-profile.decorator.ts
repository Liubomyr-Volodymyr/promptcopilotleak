import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateProfileDto } from '../dto';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';

export function ApiUpdateProfile() {
	return applyDecorators(
		ApiOperation({
			summary:
				'Update a Copilot context profile by ID (only owned by authorized user)',
		}),
		ApiBody({
			type: UpdateProfileDto,
			examples: {
				full_update: {
					summary: 'Full update payload',
					value: {
						copilot_name: 'Blog Assistant',
						glossary: [
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
								context: 'Improves organic search visibility.',
							},
						],
						style_tone: 'playful',
					},
				},
				update_glossary: {
					summary: 'Update glossary payload',
					value: {
						glossary: [
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
								context: 'Improves organic search visibility.',
							},
						],
					},
				},
				update_style_tone: {
					summary: 'Update style/tone payload',
					value: {
						style_tone: 'Classic',
					},
				},
				update_copilot_name: {
					summary: 'Update copilot name',
					value: { copilot_name: 'Blog Assistant' },
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Successfully updated profile',
			schema: {
				example: {
					id: '123',
					type: 'business',
					copilot_name: 'Blog Assistant',
					user_id: 'user-456',
					updated_at: '2025-08-05T18:00:00Z',
				},
			},
		}),
		ApiUnauthorizedResponse(),
		ApiResponse({
			status: 403,
			description: 'Forbidden: You are not the owner of this profile',
		}),
		ApiResponse({
			status: 404,
			description: 'Profile not found',
		}),
	);
}
