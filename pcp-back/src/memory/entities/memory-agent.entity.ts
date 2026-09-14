import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('memory_agent')
export class MemoryAgent {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Index({ unique: true })
	@Column({ type: 'varchar', name: 'agent_id' })
	agentId: string;

	@Index()
	@Column({ type: 'int', name: 'user_id' })
	userId: number;

	@Column({ type: 'varchar', name: 'profile_id', nullable: true })
	profileId: string | null;

	@Index()
	@Column({ type: 'varchar', name: 'owner_id', nullable: true })
	ownerId: string;

	@Column({ type: 'varchar', name: 'name' })
	name: string;

	@Column({ type: 'text', name: 'description', nullable: true })
	description?: string;

	@Column({ type: 'text', name: 'agent_sk', nullable: true })
	agentSK: string;

	@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
	updatedAt: Date;
}
