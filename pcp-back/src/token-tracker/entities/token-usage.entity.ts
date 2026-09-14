import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	Index,
} from 'typeorm';

@Entity({ name: 'token_usage' })
@Index('idx_token_usage_user', ['userId'])
@Index('idx_token_usage_model', ['model'])
export class TokenUsage {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@Column({ name: 'user_id', type: 'varchar', length: 64, nullable: true })
	userId?: string | null;

	@Column({
		name: 'request_id',
		type: 'varchar',
		length: 128,
		nullable: true,
	})
	requestId?: string | null;

	@Column({ name: 'feature', type: 'varchar', length: 64, nullable: true })
	feature?: string | null;

	@Column({ name: 'model', type: 'varchar', length: 64 })
	model: string;

	@Column({ name: 'prompt_tokens', type: 'int', default: 0 })
	promptTokens: number;

	@Column({ name: 'completion_tokens', type: 'int', default: 0 })
	completionTokens: number;

	@Column({ name: 'total_tokens', type: 'int', default: 0 })
	totalTokens: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
