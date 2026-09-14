import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';

export function ApiGetAvatar() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({
			summary: 'Get current user avatar metadata',
			description:
				'Returns metadata of the avatar image associated with the authenticated user. The image is stored in Directus.',
		}),
		ApiResponse({
			status: 200,
			description: 'Returns the avatar image',
			content: {
				'image/png': {
					schema: { type: 'string', format: 'binary' },
				},
				'image/jpeg': {
					schema: { type: 'string', format: 'binary' },
				},
			},
		}),
		ApiUnauthorizedResponse(),
		ApiResponse({ status: 404, description: 'Avatar not found' }),
	);
}
