import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClientPrompt1759758157634 implements MigrationInterface {
	name = 'ClientPrompt1759758157634';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "prompt_request" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prompt" text NOT NULL, "userId" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_98f2df3f90373856b5bcc5c50cf" PRIMARY KEY ("id"))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "prompt_request"`);
	}
}
