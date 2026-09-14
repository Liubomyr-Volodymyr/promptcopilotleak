import { MigrationInterface, QueryRunner } from 'typeorm';

export class Contact1756727205982 implements MigrationInterface {
	name = 'Contact1756727205982';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "contacts" ("id" SERIAL NOT NULL, "first_name" character varying(100), "last_name" character varying(100), "email" character varying(320) NOT NULL, "password" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_contacts_email" ON "contacts" ("email") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."UQ_contacts_email"`);
		await queryRunner.query(`DROP TABLE "contacts"`);
	}
}
