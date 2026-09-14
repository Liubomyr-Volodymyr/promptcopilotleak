import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactProviders1756730004360 implements MigrationInterface {
	name = 'ContactProviders1756730004360';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."contact_provider_enum" AS ENUM('email', 'google', 'apple', 'linkedin', 'github', 'microsoft', 'facebook')`,
		);
		await queryRunner.query(
			`CREATE TABLE "contact_providers" ("id" SERIAL NOT NULL, "provider_id" character varying(255) NOT NULL, "provider" "public"."contact_provider_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "contact_id" integer NOT NULL, CONSTRAINT "PK_cbbe0965d4af33072995f207ed7" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_cp_contact_provider" ON "contact_providers" ("contact_id", "provider") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_cp_provider_provider_id" ON "contact_providers" ("provider", "provider_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cp_provider" ON "contact_providers" ("provider") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cp_provider_id" ON "contact_providers" ("provider_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "contact_providers" ADD CONSTRAINT "FK_d90d4847bc5b37605930314e1c8" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "contact_providers" DROP CONSTRAINT "FK_d90d4847bc5b37605930314e1c8"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_cp_provider_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_cp_provider"`);
		await queryRunner.query(
			`DROP INDEX "public"."UQ_cp_provider_provider_id"`,
		);
		await queryRunner.query(`DROP INDEX "public"."UQ_cp_contact_provider"`);
		await queryRunner.query(`DROP TABLE "contact_providers"`);
		await queryRunner.query(`DROP TYPE "public"."contact_provider_enum"`);
	}
}
