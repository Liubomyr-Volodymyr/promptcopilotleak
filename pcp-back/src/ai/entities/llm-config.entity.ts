import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	OneToOne,
	JoinColumn,
} from 'typeorm';
import { PromptEntity } from './prompt.entity';

@Entity('llm_configs')
@Index(['key', 'model'], { unique: true })
export class LlmConfigEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	key: string;

	@Column({ type: 'varchar', length: 255 })
	model: string;

	@Column({ type: 'json', nullable: true })
	defaults?: {
		temperature?: number;
		maxTokens?: number;
		topP?: number;
		stop?: string[] | null;
		stream?: boolean;
	} | null;

	@OneToOne(() => PromptEntity, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn()
	systemPrompt: PromptEntity;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
