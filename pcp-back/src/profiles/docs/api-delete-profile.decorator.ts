import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';

export function ApiDeleteProfile() {
	return applyDecorators(
		ApiOperation({
			summary: 'Delete a Copilot profile (ContextProfile) by its ID',
			description:
				'Removes the context profile created by the authorized user',
		}),
		ApiParam({
			name: 'id',
			description: 'ID of the context profile to delete',
			schema: { type: 'string', example: '123' },
		}),
		ApiResponse({
			status: 204,
			description:
				'The profile has been successfully deleted (No Content)',
		}),
		ApiUnauthorizedResponse(),
		ApiResponse({
			status: 403,
			description:
				'Forbidden: You do not have permission to delete this profile',
		}),
		ApiResponse({
			status: 404,
			description: 'Profile not found',
		}),
	);
}
