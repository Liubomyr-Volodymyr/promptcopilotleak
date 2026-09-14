import { MigrationInterface, QueryRunner } from 'typeorm';

export class FileSummary1758027545139 implements MigrationInterface {
	name = 'FileSummary1758027545139';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "profile_attachments" ADD "summary" text`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "profile_attachments" DROP COLUMN "summary"`,
		);
	}
}
