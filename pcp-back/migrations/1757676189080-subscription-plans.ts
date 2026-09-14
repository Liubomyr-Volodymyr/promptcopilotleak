import { MigrationInterface, QueryRunner } from 'typeorm';

export class SubscriptionPlans1757676189080 implements MigrationInterface {
	name = 'SubscriptionPlans1757676189080';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "subscription_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying(128) NOT NULL, "stripe_product_id" character varying(128) NOT NULL, CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_0ebf9b0f0cbd7b2fb5b62e3fac" ON "subscription_plans" ("slug") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_0ebf9b0f0cbd7b2fb5b62e3fac"`,
		);
		await queryRunner.query(`DROP TABLE "subscription_plans"`);
	}
}
