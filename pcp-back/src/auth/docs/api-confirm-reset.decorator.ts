import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ConfirmResetDto } from '../dto';

export function ApiConfirmReset() {
	return applyDecorators(
		ApiOperation({ summary: 'Confirm password reset with code' }),
		ApiBody({
			type: ConfirmResetDto,
			examples: {
				default: {
					summary: 'Example payload',
					value: {
						email: 'user@example.com',
						code: '123456',
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
				oneOf: [
					{
						example: {
							statusCode: 400,
							message: 'User not found',
							error: 'Bad Request',
						},
					},
					{
						example: {
							statusCode: 400,
							message: 'Code expired',
							error: 'Bad Request',
						},
					},
					{
						example: {
							statusCode: 400,
							message: 'Invalid code',
							error: 'Bad Request',
						},
					},
					{
						example: {
							statusCode: 400,
							message: 'Too many attempts',
							error: 'Bad Request',
						},
					},
				],
			},
		}),
	);
}
