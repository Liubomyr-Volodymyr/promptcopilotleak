import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
} from 'typeorm';

@Entity('prompt_request')
export class ClientPrompt {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'text' })
	prompt: string;

	@Column({ type: 'int', nullable: true })
	userId: number | null;

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt: Date;
}
