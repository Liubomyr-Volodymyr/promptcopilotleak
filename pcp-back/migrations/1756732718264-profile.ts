import { MigrationInterface, QueryRunner } from 'typeorm';

export class Profile1756732718264 implements MigrationInterface {
	name = 'Profile1756732718264';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."contact_profile_type_enum" AS ENUM('business', 'personal')`,
		);
		await queryRunner.query(
			`CREATE TABLE "profile" ("id" SERIAL NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "copilot_name" character varying(120), "type" "public"."contact_profile_type_enum" NOT NULL, "style_tone" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "contact_id" integer NOT NULL, CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_cp_default_per_contact_type" ON "profile" ("contact_id", "type") WHERE "is_default" = true`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_contact_profiles_type" ON "profile" ("type") `,
		);
		await queryRunner.query(
			`ALTER TABLE "profile" ADD CONSTRAINT "FK_7506e9a260d040bd56ddc33b559" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "profile" DROP CONSTRAINT "FK_7506e9a260d040bd56ddc33b559"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_contact_profiles_type"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."UQ_cp_default_per_contact_type"`,
		);
		await queryRunner.query(`DROP TABLE "profile"`);
		await queryRunner.query(
			`DROP TYPE "public"."contact_profile_type_enum"`,
		);
	}
}
