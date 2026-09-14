import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Index,
	ManyToOne,
	JoinColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';
import { BillingCustomer } from './billing-customer.entity';

@Entity({ name: 'billing_subscriptions' })
@Index('IDX_bs_customer', ['customer'])
@Index('IDX_bs_email', ['email'])
@Index('IDX_bs_price_id', ['priceId'])
@Index('IDX_bs_product_id', ['productId'])
@Index('UQ_bs_stripe_subscription_id', ['stripeSubscriptionId'], {
	unique: true,
})
export class BillingSubscription {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@ManyToOne(() => BillingCustomer, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'customer_id' })
	customer?: BillingCustomer | null;

	@Column({ type: 'varchar', length: 320 })
	email: string;

	@Column({ name: 'price_id', type: 'varchar', length: 128, nullable: true })
	priceId?: string | null;

	@Column({
		name: 'product_id',
		type: 'varchar',
		length: 128,
		nullable: true,
	})
	productId?: string | null;

	@Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
	cancelAtPeriodEnd: boolean;

	@Column({ name: 'canceled_at', type: 'timestamptz', nullable: true })
	canceledAt?: Date | null;

	@Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
	endedAt?: Date | null;

	@Column({
		name: 'current_period_start',
		type: 'timestamptz',
		nullable: true,
	})
	currentPeriodStart?: Date | null;

	@Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
	currentPeriodEnd?: Date | null;

	@Column({
		name: 'stripe_subscription_id',
		type: 'varchar',
		length: 64,
		unique: true,
	})
	stripeSubscriptionId: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
