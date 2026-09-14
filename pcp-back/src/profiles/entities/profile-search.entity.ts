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

@Entity({ name: 'search_profile' })
@Index('UQ_search_profile_profile', ['profile'], { unique: true })
export class SearchProfile {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@OneToOne(() => Profile, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'profile_id' })
	profile: Profile;

	@Column({
		name: 'primary_work_area',
		type: 'varchar',
		length: 120,
		nullable: true,
	})
	primaryWorkArea?: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	format?: string;
	@Column({ type: 'varchar', length: 255, nullable: true })
	sources?: string;

	@Column({
		name: 'relevant_link',
		type: 'varchar',
		length: 500,
		nullable: true,
	})
	relevantLink?: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
