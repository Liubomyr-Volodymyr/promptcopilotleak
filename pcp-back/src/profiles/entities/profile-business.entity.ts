import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	OneToOne,
	JoinColumn,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity({ name: 'business_profile' })
@Index('UQ_business_profile_profile', ['profile'], { unique: true })
export class BusinessProfile {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@OneToOne(() => Profile, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'profile_id' })
	profile: Profile;

	@Column({ type: 'varchar', length: 150, nullable: true })
	domain?: string;

	@Column({ type: 'varchar', length: 120, nullable: true })
	role?: string;

	@Column({ name: 'primary_goal', type: 'text', nullable: true })
	primaryGoal?: string;

	@Column({ name: 'company_description', type: 'text', nullable: true })
	companyDescription: string;

	@Column({ name: 'relevant_link', type: 'varchar', nullable: true })
	relevantLink?: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
