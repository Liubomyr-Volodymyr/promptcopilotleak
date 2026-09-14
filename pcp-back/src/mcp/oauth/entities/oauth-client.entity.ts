import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('oauth_client')
export class OAuthClient {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Index({ unique: true })
	@Column({ type: 'varchar', name: 'client_id' })
	clientId: string;

	@Column({ type: 'varchar', name: 'client_secret', nullable: true })
	clientSecret?: string;

	@Column({ type: 'bigint', name: 'client_id_issued_at' })
	clientIdIssuedAt: number;

	@Column({
		type: 'bigint',
		name: 'client_secret_expires_at',
		nullable: true,
	})
	clientSecretExpiresAt?: number;

	@Column({ type: 'jsonb', name: 'metadata' })
	metadata: Record<string, unknown>;

	@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
	createdAt: Date;
}
