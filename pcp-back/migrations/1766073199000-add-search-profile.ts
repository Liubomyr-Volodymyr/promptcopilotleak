import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchProfile1766073199000 implements MigrationInterface {
	name = 'AddSearchProfile1766073199000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."contact_profile_type_enum" ADD VALUE 'search'`,
		);

		await queryRunner.query(
			`CREATE TABLE "search_profile" (
				"id" SERIAL NOT NULL,
				"primary_work_area" character varying(120),
				"format" character varying(255),
				"sources" character varying(255),
				"relevant_link" character varying(500),
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"profile_id" integer NOT NULL,
				CONSTRAINT "REL_search_profile_profile" UNIQUE ("profile_id"),
				CONSTRAINT "PK_search_profile_id" PRIMARY KEY ("id")
			)`,
		);

		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_search_profile_profile" ON "search_profile" ("profile_id")`,
		);

		await queryRunner.query(
			`ALTER TABLE "search_profile" ADD CONSTRAINT "FK_search_profile_profile" 
			FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "search_profile" DROP CONSTRAINT "FK_search_profile_profile"`,
		);

		await queryRunner.query(
			`DROP INDEX "public"."UQ_search_profile_profile"`,
		);

		await queryRunner.query(`DROP TABLE "search_profile"`);
	}
}
