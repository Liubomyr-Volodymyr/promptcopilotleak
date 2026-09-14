import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnVerificAttempts1759327721338
	implements MigrationInterface
{
	name = 'AddColumnVerificAttempts1759327721338';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "contact_verification" ADD "purpose" character varying(32) NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "contact_verification" ADD "attempts" integer NOT NULL DEFAULT '0'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "contact_verification" DROP COLUMN "attempts"`,
		);
		await queryRunner.query(
			`ALTER TABLE "contact_verification" DROP COLUMN "purpose"`,
		);
	}
}
