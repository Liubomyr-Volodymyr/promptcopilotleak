import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Index,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

export type VerificationPurpose = 'password_reset' | 'email_verify' | '2fa';

@Entity({ name: 'contact_verification' })
@Index('IDX_cv_code', ['code'])
@Index('IDX_cv_contact_email', ['contactEmail'])
@Index('UQ_cv_email_code', ['contactEmail', 'code'], { unique: true })
export class ContactVerification {
	@PrimaryGeneratedColumn('increment')
	id: number;

	@Column({ type: 'varchar', length: 32 })
	purpose: VerificationPurpose;

	@Column({ type: 'varchar', length: 64 })
	code: string;

	@Column({ name: 'contact_email', type: 'varchar', length: 320 })
	contactEmail: string;

	@Column({ type: 'int', default: 0 })
	attempts: number;

	@Column({ name: 'expires_at', type: 'timestamptz' })
	expiresAt: Date;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
