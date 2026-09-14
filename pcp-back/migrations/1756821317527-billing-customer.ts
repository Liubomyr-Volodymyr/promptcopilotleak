import { MigrationInterface, QueryRunner } from 'typeorm';

export class BillingCustomer1756821317527 implements MigrationInterface {
	name = 'BillingCustomer1756821317527';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "billing_customers" ("id" SERIAL NOT NULL, "email" character varying(320) NOT NULL, "stripe_customer_id" character varying(64) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_33443c37051e342361f61a54b86" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_billing_customers_stripe_customer_id" ON "billing_customers" ("stripe_customer_id") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_billing_customers_email" ON "billing_customers" ("email") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."UQ_billing_customers_email"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."UQ_billing_customers_stripe_customer_id"`,
		);
		await queryRunner.query(`DROP TABLE "billing_customers"`);
	}
}
