import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlans {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Index({ unique: true })
	@Column({ type: 'varchar', length: 128 })
	slug: string;

	@Column({ name: 'stripe_product_id', type: 'varchar', length: 128 })
	stripeProductId: string;
}
