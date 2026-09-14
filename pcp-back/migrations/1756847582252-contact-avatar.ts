import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactAvatar1756847582252 implements MigrationInterface {
	name = 'ContactAvatar1756847582252';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "contacts" ADD "avatar" character varying(512)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "avatar"`);
	}
}
