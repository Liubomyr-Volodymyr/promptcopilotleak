import {
	Entity,
	PrimaryGeneratedColumn,
	ManyToOne,
	JoinColumn,
	Column,
	Index,
} from 'typeorm';
import { SubscriptionPlans } from './plan.entity';

export enum BillingInterval {
	MONTH = 'month',
	YEAR = 'year',
}

@Entity('subscription_plan_prices')
@Index(['planId', 'interval', 'intervalCount'], { unique: true })
export class SubscriptionPlanPrice {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'plan_id', type: 'uuid' })
	planId: string;

	@ManyToOne(() => SubscriptionPlans, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'plan_id' })
	plan: SubscriptionPlans;

	@Column({ type: 'varchar', length: 128 })
	stripePriceId: string;

	@Column({ type: 'varchar', length: 16 })
	interval: BillingInterval;

	@Column({ type: 'int', default: 1 })
	intervalCount: number;

	@Column({ type: 'boolean', default: true })
	active: boolean;
}
