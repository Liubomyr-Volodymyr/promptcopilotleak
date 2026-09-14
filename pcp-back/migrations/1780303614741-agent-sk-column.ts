import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgentSkColumn1780303614741 implements MigrationInterface {
	name = 'AgentSkColumn1780303614741';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "memory_agent" ADD "agent_sk" text`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "memory_agent" DROP COLUMN "agent_sk"`,
		);
	}
}
