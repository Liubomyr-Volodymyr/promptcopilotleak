import { MigrationInterface, QueryRunner } from 'typeorm';

export class SuggestionFeedbacks1756817301420 implements MigrationInterface {
	name = 'SuggestionFeedbacks1756817301420';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "suggestion_feedbacks" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "original_text" text NOT NULL, "final_text" text, "domain" character varying(150), "user_feedback" text, "user_id" integer NOT NULL, "profile_id" integer, CONSTRAINT "PK_8910c56ec1943271f28a8a18242" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cf_created_at" ON "suggestion_feedbacks" ("created_at") `,
		);
		await queryRunner.query(
			`ALTER TABLE "suggestion_feedbacks" ADD CONSTRAINT "FK_5099fa95f95d789845c41db4221" FOREIGN KEY ("user_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "suggestion_feedbacks" ADD CONSTRAINT "FK_33f54606e0fee8a66808aea74b7" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "suggestion_feedbacks" DROP CONSTRAINT "FK_33f54606e0fee8a66808aea74b7"`,
		);
		await queryRunner.query(
			`ALTER TABLE "suggestion_feedbacks" DROP CONSTRAINT "FK_5099fa95f95d789845c41db4221"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_cf_created_at"`);
		await queryRunner.query(`DROP TABLE "suggestion_feedbacks"`);
	}
}
