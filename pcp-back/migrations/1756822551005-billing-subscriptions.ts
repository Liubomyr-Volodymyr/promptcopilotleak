import { MigrationInterface, QueryRunner } from 'typeorm';

export class BillingSubscriptions1756822551005 implements MigrationInterface {
	name = 'BillingSubscriptions1756822551005';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "billing_subscriptions" ("id" SERIAL NOT NULL, "email" character varying(320) NOT NULL, "price_id" character varying(128), "product_id" character varying(128), "cancel_at_period_end" boolean NOT NULL DEFAULT false, "canceled_at" TIMESTAMP WITH TIME ZONE, "ended_at" TIMESTAMP WITH TIME ZONE, "current_period_start" TIMESTAMP WITH TIME ZONE, "current_period_end" TIMESTAMP WITH TIME ZONE, "stripe_subscription_id" character varying(64) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "customer_id" integer, CONSTRAINT "UQ_477e29a06a5144238e8c06f4195" UNIQUE ("stripe_subscription_id"), CONSTRAINT "PK_da12bd094f95ed1a9ad21b0b2df" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_bs_stripe_subscription_id" ON "billing_subscriptions" ("stripe_subscription_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_bs_product_id" ON "billing_subscriptions" ("product_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_bs_price_id" ON "billing_subscriptions" ("price_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_bs_email" ON "billing_subscriptions" ("email") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_bs_customer" ON "billing_subscriptions" ("customer_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "FK_b4fe3d98619813c9f254fd1108c" FOREIGN KEY ("customer_id") REFERENCES "billing_customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "billing_subscriptions" DROP CONSTRAINT "FK_b4fe3d98619813c9f254fd1108c"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_bs_customer"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_bs_email"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_bs_price_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_bs_product_id"`);
		await queryRunner.query(
			`DROP INDEX "public"."UQ_bs_stripe_subscription_id"`,
		);
		await queryRunner.query(`DROP TABLE "billing_subscriptions"`);
	}
}
