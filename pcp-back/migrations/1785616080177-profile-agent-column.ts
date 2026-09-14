import { MigrationInterface, QueryRunner } from "typeorm";

export class ProfileAgentColumn1785616080177 implements MigrationInterface {
    name = 'ProfileAgentColumn1785616080177'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "memory_agent" ADD "profile_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "memory_agent" DROP COLUMN "profile_id"`);
    }

}
