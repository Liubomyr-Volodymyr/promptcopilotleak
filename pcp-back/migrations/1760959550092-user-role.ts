import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserRole1760959550092 implements MigrationInterface {
	name = 'UserRole1760959550092';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."contacts_role_enum" AS ENUM('user', 'admin', 'super_admin')`,
		);
		await queryRunner.query(
			`ALTER TABLE "contacts" ADD "role" "public"."contacts_role_enum" NOT NULL DEFAULT 'user'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "role"`);
		await queryRunner.query(`DROP TYPE "public"."contacts_role_enum"`);
	}
}
