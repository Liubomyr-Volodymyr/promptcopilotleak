import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ForgotPasswordDto } from '../dto';

export function ApiForgotPassword() {
	return applyDecorators(
		ApiOperation({ summary: 'Send reset password code to user email' }),
		ApiBody({
			type: ForgotPasswordDto,
			examples: {
				default: {
					summary: 'Example payload',
					value: {
						email: 'user@example.com',
					},
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Reset code sent successfully',
			schema: {
				example: {
					message: 'Reset code sent',
					success: true,
				},
			},
		}),
		ApiResponse({
			status: 400,
			description: 'Bad Request - user not found or invalid input',
			schema: {
				example: {
					statusCode: 400,
					message: 'User not found',
					error: 'Bad Request',
				},
			},
		}),
	);
}
