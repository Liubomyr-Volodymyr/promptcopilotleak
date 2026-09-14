import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Index,
	ManyToOne,
	JoinColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Contact } from './contact.entity';

export enum ContactProviderType {
	EMAIL = 'email',
	GOOGLE = 'google',
	APPLE = 'apple',
	LINKEDIN = 'linkedin',
	GITHUB = 'github',
	MICROSOFT = 'microsoft',
	FACEBOOK = 'facebook',
}

@Entity({ name: 'contact_providers' })
@Index('IDX_cp_provider_id', ['providerId'])
@Index('IDX_cp_provider', ['provider'])
@Index('UQ_cp_provider_provider_id', ['provider', 'providerId'], {
	unique: true,
})
@Index('UQ_cp_contact_provider', ['contact', 'provider'], { unique: true })
export class ContactProvider {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@Column({ name: 'provider_id', type: 'varchar', length: 255 })
	providerId: string;

	@Column({
		type: 'enum',
		enum: ContactProviderType,
		enumName: 'contact_provider_enum',
	})
	provider: ContactProviderType;

	@ManyToOne(() => Contact, (c) => c.providers, {
		onDelete: 'CASCADE',
		nullable: false,
	})
	@JoinColumn({ name: 'contact_id' })
	contact: Contact;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
