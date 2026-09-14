import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AcceptedCompletionDto } from '../dto';

export function ApiPromptAcceptedCompletionDocs() {
	return applyDecorators(
		ApiOperation({
			summary: 'Store autocomplete feedback event',
			description:
				'Stores autocomplete behavioral feedback including accepted suggestions, final text, and usage metadata for personalization and memory learning.',
		}),

		ApiBody({
			type: AcceptedCompletionDto,

			examples: {
				acceptedCompletion: {
					summary: 'Accepted autocomplete suggestion',

					value: {
						input: 'how to implement new ',
						completion: 'authentication service in NestJS',
						accepted: true,
						acceptedChars: 35,
						finalText:
							'how to implement new authentication service in NestJS',
						domain: 'https://claude.ai',
						language: 'en',
						requestId: '8f8f0f7a-71fd-4d64-a2f5-95a1fd5b6f91',
					},
				},

				rejectedCompletion: {
					summary: 'Rejected autocomplete suggestion',

					value: {
						input: 'write docker compose for ',
						completion: 'nestjs microservice setup',
						accepted: false,
						acceptedChars: 0,
						finalText: 'write docker compose for postgres redis',
						domain: 'chat.openai.com',
						language: 'en',
					},
				},
			},
		}),

		ApiResponse({
			status: 201,

			description: 'Autocomplete feedback event successfully stored',

			schema: {
				example: {
					success: true,

					eventId: '1b5d6fd3-2d0b-43f0-b9f4-c4dcf6c9d3e1',

					stored: true,

					createdAt: '2026-05-26T18:20:00.000Z',
				},
			},
		}),

		ApiResponse({
			status: 400,

			description: 'Validation failed',

			schema: {
				example: {
					statusCode: 400,

					message: [
						'acceptedChars must be a number conforming to the specified constraints',
					],

					error: 'Bad Request',
				},
			},
		}),
	);
}
