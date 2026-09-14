import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProfileAttachment1756985056205 implements MigrationInterface {
	name = 'ProfileAttachment1756985056205';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "profile_attachments" ("id" SERIAL NOT NULL, "file_name" character varying NOT NULL, "description" text, "profile_id" integer, CONSTRAINT "PK_489597dde51847a109c25e41879" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "profile_attachments" ADD CONSTRAINT "FK_ff23b188e75c2fd94e4207e467e" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "profile_attachments" DROP CONSTRAINT "FK_ff23b188e75c2fd94e4207e467e"`,
		);
		await queryRunner.query(`DROP TABLE "profile_attachments"`);
	}
}
