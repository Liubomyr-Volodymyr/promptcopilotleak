import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkContext1765206006000 implements MigrationInterface {
	name = 'LinkContext1765206006000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "link_type_enum" AS ENUM('corporate', 'personal_brand', 'agency', 'linkedin', 'twitter', 'x', 'unknown')`,
		);

		await queryRunner.query(
			`CREATE TABLE "link_context" (
				"id" SERIAL NOT NULL,
				"profile_id" integer NOT NULL,
				"url" character varying(500) NOT NULL,
				"type" "link_type_enum" NOT NULL DEFAULT 'unknown',
				"domain" character varying(255),
				"title" character varying(500),
				"description" text,
				"image_url" character varying(500),
				"content" text,
				"metadata" jsonb,
				"author" character varying(255),
				"company_name" character varying(255),
				"bio" text,
				"social_links" jsonb,
				"contact_info" jsonb,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "PK_link_context_id" PRIMARY KEY ("id")
			)`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_link_context_profile" ON "link_context" ("profile_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_link_context_url" ON "link_context" ("url")`,
		);
		await queryRunner.query(
			`ALTER TABLE "link_context" ADD CONSTRAINT "FK_link_context_profile" 
			FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "link_context" DROP CONSTRAINT "FK_link_context_profile"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_link_context_url"`);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_link_context_profile"`,
		);
		await queryRunner.query(`DROP TABLE "link_context"`);
		await queryRunner.query(`DROP TYPE "link_type_enum"`);
	}
}
