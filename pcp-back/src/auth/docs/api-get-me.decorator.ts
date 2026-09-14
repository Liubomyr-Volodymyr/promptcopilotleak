import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';

export function ApiGetMe() {
	return applyDecorators(
		ApiOperation({ summary: 'Get current user profile' }),
		ApiBearerAuth('access_token'),
		ApiResponse({
			status: 200,
			description: 'Returns the current authenticated user profile',
			schema: {
				example: {
					first_name: 'John',
					last_name: 'Doe',
					email: 'john.doe@example.com',
				},
			},
		}),
		ApiUnauthorizedResponse(),
	);
}
