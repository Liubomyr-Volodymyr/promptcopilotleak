import { MigrationInterface, QueryRunner } from 'typeorm';

export class SystemPrompts1760351238402 implements MigrationInterface {
	name = 'SystemPrompts1760351238402';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "system_prompts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_15437fd5e00018ae228c22ad8e6" UNIQUE ("key"), CONSTRAINT "PK_8c1ee4a11ab37288c47e24d384b" PRIMARY KEY ("id"))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "system_prompts"`);
	}
}
