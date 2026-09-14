import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlanPrices1758444414921 implements MigrationInterface {
	name = 'PlanPrices1758444414921';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "subscription_plan_prices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_id" uuid NOT NULL, "stripePriceId" character varying(128) NOT NULL, "interval" character varying(16) NOT NULL, "intervalCount" integer NOT NULL DEFAULT '1', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_0d799a0794b0d29173f83aa4012" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_d2ad82483409c8ebebc9108176" ON "subscription_plan_prices" ("plan_id", "interval", "intervalCount") `,
		);
		await queryRunner.query(
			`ALTER TABLE "subscription_plan_prices" ADD CONSTRAINT "FK_d2bc1de9ede5cd2f3bdf9833a97" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "subscription_plan_prices" DROP CONSTRAINT "FK_d2bc1de9ede5cd2f3bdf9833a97"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_d2ad82483409c8ebebc9108176"`,
		);
		await queryRunner.query(`DROP TABLE "subscription_plan_prices"`);
	}
}
