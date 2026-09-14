import { MigrationInterface, QueryRunner } from 'typeorm';

export class VerifiedUser1758626407368 implements MigrationInterface {
	name = 'VerifiedUser1758626407368';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "contacts" ADD "is_verified" boolean NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "contacts" DROP COLUMN "is_verified"`,
		);
	}
}
