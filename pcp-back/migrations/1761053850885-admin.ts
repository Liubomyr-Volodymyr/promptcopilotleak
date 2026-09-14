import { MigrationInterface, QueryRunner } from 'typeorm';

export class Admin1761053850885 implements MigrationInterface {
	name = 'Admin1761053850885';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."admins_role_enum" AS ENUM('admin', 'super_admin')`,
		);
		await queryRunner.query(
			`CREATE TABLE "admins" ("id" SERIAL NOT NULL, "first_name" character varying(100), "last_name" character varying(100), "email" character varying(320) NOT NULL, "role" "public"."admins_role_enum" NOT NULL DEFAULT 'admin', "avatar" character varying(512), "password" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e3b38270c97a854c48d2e80874e" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_admins_email" ON "admins" ("email") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."UQ_admins_email"`);
		await queryRunner.query(`DROP TABLE "admins"`);
		await queryRunner.query(`DROP TYPE "public"."admins_role_enum"`);
	}
}
