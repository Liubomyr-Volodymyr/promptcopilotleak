import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from 'typeorm';
import { Contact } from '../../contacts/entities/contact.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity({ name: 'suggestion_feedbacks' })
@Index('IDX_cf_created_at', ['createdAt'])
export class SuggestionFeedback {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@Column({ name: 'original_text', type: 'text' })
	originalText: string;

	@Column({ name: 'final_text', type: 'text', nullable: true })
	finalText?: string | null;

	@Column({ name: 'domain', type: 'varchar', length: 150, nullable: true })
	domain?: string | null;

	@Column({ name: 'user_feedback', type: 'text', nullable: true })
	userFeedback?: string | null;

	@ManyToOne(() => Contact, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: Contact;

	@ManyToOne(() => Profile, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'profile_id' })
	profile?: Profile | null;
}
