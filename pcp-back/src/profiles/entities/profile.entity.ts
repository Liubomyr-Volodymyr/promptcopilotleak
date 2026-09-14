import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
	OneToMany,
} from 'typeorm';
import { Contact } from '../../contacts/entities/contact.entity';
import { ProfileGlossary } from './profile-glossary.entity';
import { ProfileAttachment } from './profile-attachment.entity';

export enum ProfileType {
	BUSINESS = 'business',
	PERSONAL = 'personal',
	SEARCH = 'search',
}

@Entity({ name: 'profile' })
@Index('IDX_contact_profiles_type', ['type'])
@Index('UQ_cp_default_per_contact_type', ['contact', 'type'], {
	unique: true,
	where: `"is_default" = true`,
})
export class Profile {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@Column({ name: 'is_default', type: 'boolean', default: false })
	isDefault: boolean;

	@ManyToOne(() => Contact, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'contact_id' })
	contact: Contact;

	@Column({
		name: 'copilot_name',
		type: 'varchar',
		length: 120,
		nullable: true,
	})
	copilotName?: string;

	@Column({
		name: 'type',
		type: 'enum',
		enum: ProfileType,
		enumName: 'contact_profile_type_enum',
	})
	type: ProfileType;

	@Column({ name: 'style_tone', type: 'text' })
	styleTone: string;

	@OneToMany(() => ProfileGlossary, (g) => g.profile)
	glossary?: ProfileGlossary[];

	@OneToMany(() => ProfileAttachment, (att) => att.profile)
	attachments?: ProfileAttachment[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
