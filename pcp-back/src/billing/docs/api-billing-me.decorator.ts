import { applyDecorators } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiExtraModels,
	ApiOkResponse,
	ApiOperation,
	getSchemaPath,
} from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';
import { SubscriptionInfoDto } from '../dto/subscription.dto';

export function ApiBillingMeSubscriptionDocs() {
	return applyDecorators(
		ApiExtraModels(SubscriptionInfoDto),
		ApiOperation({
			summary: 'Get current subscription status',
			description:
				'Returns the cached subscription status from Directus for the authenticated user. If no active subscription is found, returns "none".',
		}),
		ApiBearerAuth('access_token'),
		ApiOkResponse({
			description: 'Current subscription status',
			content: {
				'application/json': {
					schema: { $ref: getSchemaPath(SubscriptionInfoDto) },
					examples: {
						active: {
							summary: 'Active subscription',
							value: {
								status: 'active',
								current_period_end: '2025-09-21T12:00:00.000Z',
								cancel_at_period_end: false,
							},
						},
						none: {
							summary: 'No subscription',
							value: {
								status: 'none',
								current_period_end: null,
								cancel_at_period_end: null,
							},
						},
					},
				},
			},
		}),
		ApiUnauthorizedResponse(),
	);
}
