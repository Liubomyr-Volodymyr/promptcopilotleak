import { MigrationInterface, QueryRunner } from 'typeorm';

export class TokenUsage1759482145743 implements MigrationInterface {
	name = 'TokenUsage1759482145743';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "token_usage" ("id" SERIAL NOT NULL, "user_id" character varying(64), "request_id" character varying(128), "model" character varying(64) NOT NULL, "prompt_tokens" integer NOT NULL DEFAULT '0', "completion_tokens" integer NOT NULL DEFAULT '0', "total_tokens" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b85b17103d77d9695632654729d" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "idx_token_usage_model" ON "token_usage" ("model") `,
		);
		await queryRunner.query(
			`CREATE INDEX "idx_token_usage_user" ON "token_usage" ("user_id") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_token_usage_user"`);
		await queryRunner.query(`DROP INDEX "public"."idx_token_usage_model"`);
		await queryRunner.query(`DROP TABLE "token_usage"`);
	}
}
