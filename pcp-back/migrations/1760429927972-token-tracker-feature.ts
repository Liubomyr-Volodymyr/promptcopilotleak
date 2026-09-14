import { MigrationInterface, QueryRunner } from 'typeorm';

export class TokenTrackerFeature1760429927972 implements MigrationInterface {
	name = 'TokenTrackerFeature1760429927972';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "token_usage" ADD "feature" character varying(64)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "token_usage" DROP COLUMN "feature"`,
		);
	}
}
