import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import Stripe from 'stripe';
import { SubscriptionPlans } from '../billing/entities/plan.entity';
import {
	BillingInterval,
	SubscriptionPlanPrice,
} from '../billing/entities/subscription_plan_prices.entity';

export class PlanPricesFromStripeSeeder implements Seeder {
	public async run(dataSource: DataSource): Promise<void> {
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
			apiVersion: '2024-12-18.acacia',
		});

		const plansRepo = dataSource.getRepository(SubscriptionPlans);
		const pricesRepo = dataSource.getRepository(SubscriptionPlanPrice);

		const plans = await plansRepo.find();

		for (const plan of plans) {
			const list = await stripe.prices.list({
				product: plan.stripeProductId,
				active: true,
				limit: 100,
				expand: ['data.recurring'],
			});

			const rows: Array<Partial<SubscriptionPlanPrice>> = list.data
				.filter((p) => p.type === 'recurring' && p.recurring)
				.map((p) => ({
					planId: plan.id,
					stripePriceId: p.id,
					interval: p.recurring!.interval as BillingInterval,
					intervalCount: p.recurring!.interval_count ?? 1,
					active: true,
				}));

			if (rows.length) {
				await pricesRepo.upsert(rows, {
					conflictPaths: ['planId', 'interval', 'intervalCount'],
				});
			}
		}
	}
}
