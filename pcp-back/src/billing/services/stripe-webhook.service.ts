import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from '../../common/constants';

@Injectable()
export class StripeWebhookService {
	constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe) {}

	async handle(signature: string, rawBody: Buffer) {
		let event: Stripe.Event;
		try {
			event = this.stripe.webhooks.constructEvent(
				rawBody,
				signature,
				process.env.STRIPE_WEBHOOK_SECRET!,
			);
		} catch (e: any) {
			throw new BadRequestException(
				`Invalid stripe signature: ${e.message}`,
			);
		}

		try {
			switch (event.type) {
				case 'customer.subscription.created':
				case 'customer.subscription.updated':
				case 'customer.subscription.deleted': {
					console.log(`[WH] Subscription event: ${event.type}`, {
						subscriptionId: (
							event.data.object as Stripe.Subscription
						).id,
					});
					break;
				}
				default:
					break;
			}
		} catch (e: any) {
			console.error(
				'[WH] handler error:',
				e?.response?.status,
				e?.response?.data || e?.message,
			);
		}

		return { ok: true };
	}
}
