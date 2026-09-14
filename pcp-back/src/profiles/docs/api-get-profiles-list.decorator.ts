import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';

export function ApiGetProfilesList() {
	return applyDecorators(
		ApiOperation({
			summary:
				'Get list of Copilot profiles for the authorized user (ID and name only)',
			description:
				'Returns minimal list of user profiles for dropdowns or quick selection',
		}),
		ApiResponse({
			status: 200,
			description: 'Array of Copilot profiles with id and copilot_name',
			schema: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							example: '123',
						},
						name: {
							type: 'string',
							example: 'Cold Outreach Assistant',
						},
						label: {
							type: 'string',
							enum: ['Text', 'Search'],
							description:
								'Short label for GPTs - Context Profile pop-up',
							example: 'Text',
						},
					},
				},
			},
		}),
		ApiUnauthorizedResponse(),
	);
}
