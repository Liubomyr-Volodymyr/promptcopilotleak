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

@Entity({ name: 'personal_profile' })
@Index('UQ_personal_profile_profile', ['profile'], { unique: true })
export class PersonalProfile {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@OneToOne(() => Profile, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'profile_id' })
	profile: Profile;

	@Column({ type: 'varchar', length: 120, nullable: true })
	theme?: string;

	@Column({ type: 'varchar', length: 120, nullable: true })
	role?: string;

	@Column({ type: 'text', nullable: true })
	goal?: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
