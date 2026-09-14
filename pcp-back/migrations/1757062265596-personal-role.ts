import { MigrationInterface, QueryRunner } from 'typeorm';

export class PersonalRole1757062265596 implements MigrationInterface {
	name = 'PersonalRole1757062265596';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "personal_profile" ADD "role" character varying(120)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "personal_profile" DROP COLUMN "role"`,
		);
	}
}
