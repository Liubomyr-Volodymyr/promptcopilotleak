import { DataSource } from 'typeorm';
import { runSeeders, Seeder } from 'typeorm-extension';

import { PlanSeeder } from './plan.seeder';
import { PlanPricesFromStripeSeeder } from './stripe-plan-prices.seeder';
import { LlmConfigSeeder } from './llm-config.seeder';
import { RootAdminSeeder } from './root-admin';

export class MainSeeder implements Seeder {
	async run(dataSource: DataSource): Promise<void> {
		await runSeeders(dataSource, {
			seeds: [PlanSeeder, PlanPricesFromStripeSeeder],
		});
		await runSeeders(dataSource, {
			seeds: [LlmConfigSeeder],
		});
		await runSeeders(dataSource, {
			seeds: [RootAdminSeeder],
		});
	}
}
