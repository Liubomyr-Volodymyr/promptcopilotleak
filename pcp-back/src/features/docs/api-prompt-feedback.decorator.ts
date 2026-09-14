import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePromptFeedbackDto } from '../dto';

export function ApiCreatePromptFeedback() {
	return applyDecorators(
		ApiOperation({ summary: 'Submit feedback on a prompt' }),
		ApiBody({
			type: CreatePromptFeedbackDto,
			examples: {
				default: {
					summary: 'Example prompt feedback payload',
					value: {
						original_text: 'Write a poem about the sea',
						final_text: 'The waves crash gently on the shore...',
						domain: 'https://example.com',
						user_feedback: 'upvote',
						profile: null,
					},
				},
			},
		}),
		ApiResponse({
			status: 201,
			description: 'Feedback submitted successfully',
			schema: {
				example: {
					id: 6,
					created_at: '2025-07-10T09:12:55.222Z',
					updated_at: null,
					original_text:
						'How long time we need complete marsian mission',
					final_text:
						'How long time it take to complete the Martian mission',
					domain: 'https://chatgpt.com',
					user_feedback: 'upvote',
					user_id: '5c270a9a-ed54-4698-81ee-5fb6227ee6f4',
					profile: null,
				},
			},
		}),
		ApiResponse({
			status: 400,
			description:
				'Validation error – one or more required fields are missing or invalid',
		}),
		ApiResponse({
			status: 500,
			description:
				'Internal server error – something went wrong on the server',
		}),
	);
}
