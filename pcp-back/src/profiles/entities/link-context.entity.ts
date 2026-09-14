import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
} from 'typeorm';
import { Profile } from './profile.entity';

export enum LinkType {
	CORPORATE = 'corporate',
	PERSONAL_BRAND = 'personal_brand',
	AGENCY = 'agency',
	LINKEDIN = 'linkedin',
	TWITTER = 'twitter',
	X = 'x',
	UNKNOWN = 'unknown',
}

@Entity({ name: 'link_context' })
@Index('IDX_link_context_profile', ['profile'])
@Index('IDX_link_context_url', ['url'])
export class LinkContext {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@ManyToOne(() => Profile, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'profile_id' })
	profile: Profile;

	@Column({ type: 'varchar', length: 500 })
	url: string;

	@Column({
		type: 'enum',
		enum: LinkType,
		enumName: 'link_type_enum',
		default: LinkType.UNKNOWN,
	})
	type: LinkType;

	@Column({ type: 'varchar', length: 255, nullable: true })
	domain?: string;

	@Column({ type: 'varchar', length: 500, nullable: true })
	title?: string;

	@Column({ type: 'text', nullable: true })
	description?: string;

	@Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
	imageUrl?: string;

	@Column({ type: 'text', nullable: true })
	content?: string;

	@Column({ type: 'jsonb', nullable: true })
	metadata?: Record<string, any>;

	@Column({ type: 'varchar', length: 255, nullable: true })
	author?: string;

	@Column({
		name: 'company_name',
		type: 'varchar',
		length: 255,
		nullable: true,
	})
	companyName?: string;

	@Column({ type: 'text', nullable: true })
	bio?: string;

	@Column({ name: 'social_links', type: 'jsonb', nullable: true })
	socialLinks?: Record<string, string>;

	@Column({ name: 'contact_info', type: 'jsonb', nullable: true })
	contactInfo?: Record<string, string>;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
