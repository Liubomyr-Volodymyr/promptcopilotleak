import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from 'typeorm';
import { Contact } from './contact.entity';

@Entity('free_access')
@Index(['userId'], { unique: true })
export class FreeAccess {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', name: 'user_id' })
	userId: string;

	@ManyToOne(() => Contact, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: Contact;

	@Column({ default: true })
	permanent: boolean;

	@CreateDateColumn()
	createdAt: Date;
}
