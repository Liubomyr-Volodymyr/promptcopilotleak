import { applyDecorators } from '@nestjs/common';
import {
	ApiBody,
	ApiExtraModels,
	ApiOperation,
	ApiResponse,
	getSchemaPath,
} from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';
import {
	CreateProfileDto,
	ProfileType,
	BusinessProfileDto,
	PersonalProfileDto,
} from '../dto';

export function ApiCreateProfile() {
	return applyDecorators(
		ApiOperation({
			summary:
				'Create a new context profile (Copilot configuration) for the authorized user',
		}),

		ApiExtraModels(
			CreateProfileDto,
			BusinessProfileDto,
			PersonalProfileDto,
		),

		ApiBody({
			schema: {
				oneOf: [
					{
						allOf: [
							{
								type: 'object',
								properties: {
									type: {
										type: 'string',
										enum: [ProfileType.BUSINESS],
									},
								},
								required: ['type'],
							},
							{
								type: 'object',
								properties: {
									profile: {
										$ref: getSchemaPath(BusinessProfileDto),
									},
								},
								required: ['business'],
							},
						],
					},
					{
						allOf: [
							{
								type: 'object',
								properties: {
									type: {
										type: 'string',
										enum: [ProfileType.PERSONAL],
									},
								},
								required: ['type'],
							},
							{
								type: 'object',
								properties: {
									profile: {
										$ref: getSchemaPath(PersonalProfileDto),
									},
								},
								required: ['personal'],
							},
						],
					},
				],
			},
			examples: {
				business: {
					summary: 'Business profile payload (Work profile)',
					description:
						'For Work profiles: domain represents Work Area, role is the professional role, primary_goal is the main objective.',
					value: {
						type: 'business',
						profile: {
							domain: 'technology',
							role: 'Full-stack Developer',
							primary_goal: 'Optimize performance',
							relevant_link: 'https://www.google.com',
							company_description: 'Your company...',
						},
					},
				},
				personal: {
					summary: 'Personal profile payload',
					description:
						'For Personal profiles: theme represents Area of life, role is the personal role, primary_goal is the main objective.',
					value: {
						type: 'personal',
						profile: {
							theme: 'learning_research',
							role: 'Technical skill learner',
							primary_goal: 'Study material creation',
							relevant_link: 'https://example.com',
						},
					},
				},
			},
		}),

		ApiResponse({
			status: 201,
			description: 'The profile has been successfully created',
			schema: {
				example: {
					id: '213',
					type: 'business',
					user_id: 'user-456',
					created_at: '2025-08-05T17:30:00Z',
				},
			},
		}),

		ApiUnauthorizedResponse(),

		ApiResponse({
			status: 403,
			description: 'Forbidden: maximum profile limit (10) reached',
		}),
	);
}
