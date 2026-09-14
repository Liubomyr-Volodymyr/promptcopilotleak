import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Index,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

export enum AdminRole {
	Admin = 'admin',
	SuperAdmin = 'super_admin',
}

@Entity({ name: 'admins' })
@Index('UQ_admins_email', ['email'], { unique: true })
export class Admin {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@Column({
		type: 'varchar',
		length: 100,
		nullable: true,
		name: 'first_name',
	})
	firstName?: string;

	@Column({ type: 'varchar', length: 100, nullable: true, name: 'last_name' })
	lastName?: string;

	@Column({ type: 'varchar', length: 320 })
	email: string;

	@Column({
		type: 'enum',
		enum: AdminRole,
		default: AdminRole.Admin,
	})
	role: AdminRole;

	@Column({ type: 'varchar', length: 512, nullable: true, name: 'avatar' })
	avatar?: string;

	@Column({ type: 'varchar', length: 255, select: false, nullable: true })
	password?: string;

	@Column({ type: 'boolean', name: 'is_active', default: true })
	isActive: boolean;

	@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
	updatedAt: Date;
}
