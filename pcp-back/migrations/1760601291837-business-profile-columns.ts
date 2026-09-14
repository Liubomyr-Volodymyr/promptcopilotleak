import { MigrationInterface, QueryRunner } from 'typeorm';

export class BusinessProfileColumns1760601291837 implements MigrationInterface {
	name = 'BusinessProfileColumns1760601291837';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "business_profile" ADD "company_description" text`,
		);
		await queryRunner.query(
			`ALTER TABLE "business_profile" ADD "relevant_link" character varying`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "business_profile" DROP COLUMN "relevant_link"`,
		);
		await queryRunner.query(
			`ALTER TABLE "business_profile" DROP COLUMN "company_description"`,
		);
	}
}
