import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

import { SubscriptionPlans } from '../billing/entities/plan.entity';

export class PlanSeeder implements Seeder {
	public async run(dataSource: DataSource): Promise<void> {
		const repo = dataSource.getRepository(SubscriptionPlans);

		const items: Array<Partial<SubscriptionPlans>> = [
			{
				slug: 'pro',
				stripeProductId: process.env.STRIPE_PRODUCT_ID,
			},
		];

		await repo.upsert(items, { conflictPaths: ['slug'] });
	}
}
