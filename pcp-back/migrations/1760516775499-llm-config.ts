import { MigrationInterface, QueryRunner } from 'typeorm';

export class LlmConfig1760516775499 implements MigrationInterface {
	name = 'LlmConfig1760516775499';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "llm_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "model" character varying(255) NOT NULL, "defaults" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "systemPromptId" uuid NOT NULL, CONSTRAINT "REL_d80acff3a49aa1320d5ef1a847" UNIQUE ("systemPromptId"), CONSTRAINT "PK_59d393b0d96abb589b3d0a1aa5b" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_6ea94b72f63078542564eae4b6" ON "llm_configs" ("key", "model") `,
		);
		await queryRunner.query(
			`ALTER TABLE "llm_configs" ADD CONSTRAINT "FK_d80acff3a49aa1320d5ef1a8479" FOREIGN KEY ("systemPromptId") REFERENCES "system_prompts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "llm_configs" DROP CONSTRAINT "FK_d80acff3a49aa1320d5ef1a8479"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_6ea94b72f63078542564eae4b6"`,
		);
		await queryRunner.query(`DROP TABLE "llm_configs"`);
	}
}
