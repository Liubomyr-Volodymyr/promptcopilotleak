import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { SubscriptionRepository } from './subscription.repository';
import { STRIPE_CLIENT } from '../../common/constants';

@Injectable()
export class SubscriptionCustomerService {
	constructor(
		@Inject(STRIPE_CLIENT) private stripe: Stripe,
		private store: SubscriptionRepository,
	) {}

	async ensureCustomer(
		email: string,
		user_id?: string,
	): Promise<{
		stripeCustomerId: string;
		directusCustomerId: string | number;
	}> {
		const existing = await this.store.findCustomerByEmail(email);
		if (existing?.stripe_customer_id) {
			return {
				stripeCustomerId: existing.stripe_customer_id,
				directusCustomerId: existing.id!,
			};
		}

		const list = await this.stripe.customers.list({ email, limit: 1 });
		const stripeCustomerId =
			list.data[0]?.id ??
			(
				await this.stripe.customers.create({
					email,
					metadata: { user_id },
				})
			).id;

		if (existing?.id) {
			await this.store.updateCustomer(existing.id, {
				stripe_customer_id: stripeCustomerId,
				user_id,
			});
			return { stripeCustomerId, directusCustomerId: existing.id };
		}
		const created = await this.store.createCustomer({
			email,
			stripe_customer_id: stripeCustomerId,
			user_id,
		});
		return { stripeCustomerId, directusCustomerId: created.id! };
	}
}
