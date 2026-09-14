import { MigrationInterface, QueryRunner } from 'typeorm';

export class MemoryAgent1780052894080 implements MigrationInterface {
	name = 'MemoryAgent1780052894080';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "memory_agent" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "agent_id" character varying NOT NULL, "user_id" integer NOT NULL, "owner_id" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b531e38965b51afecead7686ac6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_7affe0c2205fb65b07b56721c2" ON "memory_agent" ("agent_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_fadd23eb8245dfab7d2b38607c" ON "memory_agent" ("user_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_3f0ff79d6bca1094d04f0f1d95" ON "memory_agent" ("owner_id") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX "public"."IDX_3f0ff79d6bca1094d04f0f1d95"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_fadd23eb8245dfab7d2b38607c"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_7affe0c2205fb65b07b56721c2"`,
		);
		await queryRunner.query(`DROP TABLE "memory_agent"`);
	}
}
