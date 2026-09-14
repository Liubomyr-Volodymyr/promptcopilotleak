import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	BeforeInsert,
	BeforeUpdate,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity({ name: 'profile_glossary' })
@Index('IDX_pg_profile', ['profile'])
@Index('UQ_pg_profile_term', ['profile', 'term'], { unique: true })
export class ProfileGlossary {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@ManyToOne(() => Profile, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'profile_id' })
	profile: Profile;

	@Column({ type: 'varchar', length: 200 })
	term: string;

	@Column({ type: 'text', nullable: true })
	explanation?: string;

	@Column({ name: 'type', type: 'varchar', length: 64, nullable: true })
	type?: string;

	@Column({ name: 'definition', type: 'text', nullable: true })
	definition?: string;

	@Column({ name: 'ownership', type: 'varchar', length: 120, nullable: true })
	ownership?: string;

	@Column({ name: 'context', type: 'text', nullable: true })
	context?: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;

	@BeforeInsert()
	@BeforeUpdate()
	normalize() {
		if (this.term) this.term = this.term.trim();
		if (this.type) this.type = this.type.trim().toLowerCase();
		if (this.ownership) this.ownership = this.ownership.trim();
	}
}
