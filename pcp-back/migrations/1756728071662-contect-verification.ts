import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContectVerification1756728071662 implements MigrationInterface {
	name = 'ContectVerification1756728071662';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "contact_verification" ("id" SERIAL NOT NULL, "code" character varying(64) NOT NULL, "contact_email" character varying(320) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0c09050d83aa445d897a47c7533" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_cv_email_code" ON "contact_verification" ("contact_email", "code") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cv_contact_email" ON "contact_verification" ("contact_email") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cv_code" ON "contact_verification" ("code") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_cv_code"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_cv_contact_email"`);
		await queryRunner.query(`DROP INDEX "public"."UQ_cv_email_code"`);
		await queryRunner.query(`DROP TABLE "contact_verification"`);
	}
}
