import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';
import { UrlDto } from '../dto/subscription.dto';

export function ApiBillingPortalDocs() {
	return applyDecorators(
		ApiOperation({
			summary: 'Create Stripe Customer Portal session',
			description:
				'Creates a session for the Stripe Customer Portal so the user can manage billing and subscription settings.',
		}),
		ApiBearerAuth('access_token'),
		ApiResponse({
			status: 200,
			description: 'Stripe Customer Portal URL',
			type: UrlDto,
			schema: {
				example: {
					url: 'https://billing.stripe.com/p/session/test_...',
				},
			},
		}),
		ApiUnauthorizedResponse(),
	);
}
