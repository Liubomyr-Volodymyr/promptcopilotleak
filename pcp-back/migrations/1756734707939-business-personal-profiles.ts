import { MigrationInterface, QueryRunner } from 'typeorm';

export class BusinessPersonalProfiles1756734707939
	implements MigrationInterface
{
	name = 'BusinessPersonalProfiles1756734707939';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "personal_profile" ("id" SERIAL NOT NULL, "theme" character varying(120), "goal" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "profile_id" integer NOT NULL, CONSTRAINT "REL_603a6cf1a64a6e395ffe645419" UNIQUE ("profile_id"), CONSTRAINT "PK_a12805620842bd38170b27dc707" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_personal_profile_profile" ON "personal_profile" ("profile_id") `,
		);
		await queryRunner.query(
			`CREATE TABLE "business_profile" ("id" SERIAL NOT NULL, "domain" character varying(150), "role" character varying(120), "primary_goal" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "profile_id" integer NOT NULL, CONSTRAINT "REL_9da77641847aa1f9990cef4bbe" UNIQUE ("profile_id"), CONSTRAINT "PK_e71e197c467c1ec2c45a1652110" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_business_profile_profile" ON "business_profile" ("profile_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "personal_profile" ADD CONSTRAINT "FK_603a6cf1a64a6e395ffe6454199" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "business_profile" ADD CONSTRAINT "FK_9da77641847aa1f9990cef4bbe3" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "business_profile" DROP CONSTRAINT "FK_9da77641847aa1f9990cef4bbe3"`,
		);
		await queryRunner.query(
			`ALTER TABLE "personal_profile" DROP CONSTRAINT "FK_603a6cf1a64a6e395ffe6454199"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."UQ_business_profile_profile"`,
		);
		await queryRunner.query(`DROP TABLE "business_profile"`);
		await queryRunner.query(
			`DROP INDEX "public"."UQ_personal_profile_profile"`,
		);
		await queryRunner.query(`DROP TABLE "personal_profile"`);
	}
}
