import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Index,
	CreateDateColumn,
	UpdateDateColumn,
	BeforeInsert,
	BeforeUpdate,
	OneToMany,
} from 'typeorm';
import { ContactProvider } from './contact-provider.entity';

export enum UserRole {
	User = 'user',
	Admin = 'admin',
	SuperAdmin = 'super_admin',
}

@Entity({ name: 'contacts' })
@Index('UQ_contacts_email', ['email'], { unique: true })
export class Contact {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@Column({
		type: 'varchar',
		length: 100,
		nullable: true,
		name: 'first_name',
	})
	firstName: string;

	@Column({ type: 'varchar', length: 100, nullable: true, name: 'last_name' })
	lastName: string;

	@Column({ type: 'varchar', length: 320 })
	email: string;

	@Column({
		type: 'enum',
		enum: UserRole,
		default: UserRole.User,
	})
	role: UserRole;

	@Column({ type: 'varchar', length: 512, nullable: true, name: 'avatar' })
	avatar?: string;

	@Column({ type: 'varchar', length: 255, select: false, nullable: true })
	password?: string;

	@Column({ type: 'boolean', name: 'is_verified' })
	isVerified: boolean;

	@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
	updatedAt: Date;

	@OneToMany(() => ContactProvider, (cp) => cp.contact)
	providers?: ContactProvider[];

	@BeforeInsert()
	@BeforeUpdate()
	normalizeEmail() {
		if (this.email) this.email = this.email.trim().toLowerCase();
	}
}
