import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProfileGlossary1756733937623 implements MigrationInterface {
	name = 'ProfileGlossary1756733937623';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "profile_glossary" ("id" SERIAL NOT NULL, "term" character varying(200) NOT NULL, "explanation" text, "type" character varying(64), "definition" text, "ownership" character varying(120), "context" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "profile_id" integer NOT NULL, CONSTRAINT "PK_efa84dc482dd3eaf61af9e2db30" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_pg_profile_term" ON "profile_glossary" ("profile_id", "term") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_pg_profile" ON "profile_glossary" ("profile_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "profile_glossary" ADD CONSTRAINT "FK_a0a179c720aa78b31a683f9d681" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "profile_glossary" DROP CONSTRAINT "FK_a0a179c720aa78b31a683f9d681"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_pg_profile"`);
		await queryRunner.query(`DROP INDEX "public"."UQ_pg_profile_term"`);
		await queryRunner.query(`DROP TABLE "profile_glossary"`);
	}
}
