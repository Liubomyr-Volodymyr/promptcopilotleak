import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	ManyToOne,
	JoinColumn,
	RelationId,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('profile_attachments')
export class ProfileAttachment {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ name: 'file_name' })
	fileName: string;

	@Column({ nullable: true, type: 'text' })
	summary?: string;

	@Column({ nullable: true, type: 'text' })
	description?: string;

	@ManyToOne(() => Profile, (profile) => profile.attachments, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'profile_id' })
	profile: Profile;

	@RelationId((attachment: ProfileAttachment) => attachment.profile)
	profileId: number;
}
