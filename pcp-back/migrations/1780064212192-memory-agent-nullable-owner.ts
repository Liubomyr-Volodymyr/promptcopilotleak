import { MigrationInterface, QueryRunner } from 'typeorm';

export class MemoryAgentNullableOwner1780064212192
	implements MigrationInterface
{
	name = 'MemoryAgentNullableOwner1780064212192';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "memory_agent" ALTER COLUMN "owner_id" DROP NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "memory_agent" ALTER COLUMN "owner_id" SET NOT NULL`,
		);
	}
}
