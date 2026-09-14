import { MigrationInterface, QueryRunner } from 'typeorm';

export class OauthClient1784192833452 implements MigrationInterface {
	name = 'OauthClient1784192833452';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "oauth_client" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_id" character varying NOT NULL, "client_secret" character varying, "client_id_issued_at" bigint NOT NULL, "client_secret_expires_at" bigint, "metadata" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_oauth_client_id" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_oauth_client_client_id" ON "oauth_client" ("client_id") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_oauth_client_client_id"`);
		await queryRunner.query(`DROP TABLE "oauth_client"`);
	}
}
