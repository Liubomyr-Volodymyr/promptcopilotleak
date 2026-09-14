import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LandingSupportDto } from '../dto';

export function ApiLandingSupportMail() {
	return applyDecorators(
		ApiOperation({
			summary: 'Send contact form message',
			description:
				'Public endpoint for landing page contact form. Sends email to info@promptcopilot.io. Requires agreeTerms to be true.',
		}),
		ApiResponse({
			status: 200,
			description: 'Contact email sent successfully',
			schema: {
				type: 'object',
				properties: {
					message: {
						type: 'string',
						example: 'Contact email sent successfully',
					},
				},
			},
		}),
		ApiResponse({
			status: 400,
			description:
				'Validation error - missing required fields or agreeTerms is false',
		}),
		ApiResponse({
			status: 500,
			description: 'Mail service error',
		}),
		ApiBody({
			description:
				'Contact form payload. All fields are required. agreeTerms must be true to submit.',
			type: LandingSupportDto,
			examples: {
				default: {
					summary: 'Example contact form submission',
					value: {
						firstName: 'John',
						lastName: 'Doe',
						email: 'john.doe@example.com',
						message: 'I have a question about your service.',
						agreeTerms: true,
					},
				},
			},
		}),
	);
}
