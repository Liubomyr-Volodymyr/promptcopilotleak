import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Index,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'billing_customers' })
@Index('UQ_billing_customers_email', ['email'], { unique: true })
@Index('UQ_billing_customers_stripe_customer_id', ['stripeCustomerId'], {
	unique: true,
})
export class BillingCustomer {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@Column({ type: 'varchar', length: 320 })
	email: string;

	@Column({ name: 'stripe_customer_id', type: 'varchar', length: 64 })
	stripeCustomerId: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
