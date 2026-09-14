import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';

export function ApiDeleteContact() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({
			summary: 'Delete a user contact by ID',
		}),
		ApiResponse({
			status: 200,
			description: 'Contact deleted successfully',
			schema: {
				example: {
					message: 'Contact deleted successfully',
				},
			},
		}),
		ApiUnauthorizedResponse(),
		ApiResponse({
			status: 404,
			description: 'Contact not found',
		}),
	);
}
