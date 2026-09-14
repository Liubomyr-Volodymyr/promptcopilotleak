import { MigrationInterface, QueryRunner } from 'typeorm';

export class FreeAccess1761211820390 implements MigrationInterface {
	name = 'FreeAccess1761211820390';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "free_access" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" integer NOT NULL, "permanent" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7de1c54715f20e3a2a47d567091" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_33330d9043a9f6d0df032a54f8" ON "free_access" ("user_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "free_access" ADD CONSTRAINT "FK_33330d9043a9f6d0df032a54f86" FOREIGN KEY ("user_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "free_access" DROP CONSTRAINT "FK_33330d9043a9f6d0df032a54f86"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_33330d9043a9f6d0df032a54f8"`,
		);
		await queryRunner.query(`DROP TABLE "free_access"`);
	}
}
