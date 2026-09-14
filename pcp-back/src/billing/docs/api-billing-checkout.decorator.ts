import { applyDecorators } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
} from '@nestjs/swagger';
import { CreateSubscriptionCheckoutDto, UrlDto } from '../dto/subscription.dto';

export function ApiBillingCheckoutDocs() {
	return applyDecorators(
		ApiOperation({
			summary: 'Create Stripe Checkout Session',
			description:
				'Creates a Stripe Checkout Session in **subscription** mode. ' +
				"Authenticated user's `email` and `user_id` are taken from the JWT and **ignored** from the request body. " +
				'Provide your plan via `slug`. Optionally include `trial_period_days` for a free trial period, `metadata` (saved on the Session), and `quantity`.',
		}),
		ApiBearerAuth('access_token'),
		ApiBody({
			type: CreateSubscriptionCheckoutDto,
			required: true,
			examples: {
				minimal: {
					summary: 'Minimal (no trial)',
					value: {
						slug: 'pro',
						period: 'month',
					},
				},
				withTrial: {
					summary: 'With 7-day trial',
					value: {
						slug: 'pro',
						period: 'month',
						trial_period_days: 7,
					},
				},
				withMetadata: {
					summary: 'With metadata',
					value: {
						slug: 'pro',
						period: 'month',
						metadata: { source: 'billing-page' },
					},
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Stripe Checkout URL',
			type: UrlDto,
			schema: {
				example: {
					url: 'https://checkout.stripe.com/c/pay/cs_test_...',
				},
			},
		}),
		ApiResponse({
			status: 400,
			description: 'Bad Request (missing/invalid `slug`)',
			schema: {
				example: {
					statusCode: 400,
					message: 'slug must be a valid plan identifier',
					error: 'Bad Request',
				},
			},
		}),
		ApiResponse({
			status: 401,
			description: 'Unauthorized (missing/invalid token)',
			schema: { example: { statusCode: 401, message: 'Unauthorized' } },
		}),
		ApiResponse({
			status: 404,
			description: 'Plan not found by `slug`',
			schema: {
				example: {
					statusCode: 404,
					message: 'Plan with provided slug not found',
					error: 'Not Found',
				},
			},
		}),
		ApiResponse({
			status: 502,
			description: 'Stripe error while creating Checkout Session',
			schema: {
				example: {
					statusCode: 502,
					message: 'Stripe: invalid price or configuration',
					error: 'Bad Gateway',
				},
			},
		}),
	);
}
