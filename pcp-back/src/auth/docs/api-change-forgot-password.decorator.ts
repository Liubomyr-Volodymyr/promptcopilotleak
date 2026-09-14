import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ConfirmResetDto } from '../dto';

export function ApiChangeForgotPassword() {
	return applyDecorators(
		ApiOperation({ summary: 'Confirm password reset with code' }),
		ApiBody({
			type: ConfirmResetDto,
			examples: {
				default: {
					summary: 'Example payload',
					value: {
						token: '123456',
						newPassword: 'StrongP@ssw0rd',
					},
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Password successfully updated',
			schema: {
				example: {
					message: 'Password updated',
				},
			},
		}),
		ApiResponse({
			status: 400,
			description:
				'Bad Request - user not found, code expired, invalid code or too many attempts',
			schema: {
				examples: [
					{
						statusCode: 400,
						message: 'User not found',
						error: 'Bad Request',
					},
					{
						statusCode: 400,
						message: 'Code expired',
						error: 'Bad Request',
					},
					{
						statusCode: 400,
						message: 'Invalid code',
						error: 'Bad Request',
					},
					{
						statusCode: 400,
						message: 'Too many attempts',
						error: 'Bad Request',
					},
				],
			},
		}),
	);
}
