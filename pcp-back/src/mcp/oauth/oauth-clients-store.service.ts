import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import { OAuthClient } from './entities/oauth-client.entity';

@Injectable()
export class OAuthClientsStoreService implements OAuthRegisteredClientsStore {
	constructor(
		@InjectRepository(OAuthClient)
		private readonly clientRepository: Repository<OAuthClient>,
	) {}

	async getClient(
		clientId: string,
	): Promise<OAuthClientInformationFull | undefined> {
		const row = await this.clientRepository.findOne({
			where: { clientId },
		});
		if (!row) return undefined;

		return this.toClientInformation(row);
	}

	async registerClient(
		client: OAuthClientInformationFull,
	): Promise<OAuthClientInformationFull> {
		const {
			client_id: clientId,
			client_secret: clientSecret,
			client_id_issued_at: clientIdIssuedAt,
			client_secret_expires_at: clientSecretExpiresAt,
			...metadata
		} = client;

		await this.clientRepository.save(
			this.clientRepository.create({
				clientId,
				clientSecret,
				clientIdIssuedAt:
					clientIdIssuedAt ?? Math.floor(Date.now() / 1000),
				clientSecretExpiresAt,
				metadata,
			}),
		);

		return client;
	}

	private toClientInformation(row: OAuthClient): OAuthClientInformationFull {
		return {
			...(row.metadata as Record<string, unknown>),
			client_id: row.clientId,
			client_secret: row.clientSecret,
			client_id_issued_at: Number(row.clientIdIssuedAt),
			client_secret_expires_at: row.clientSecretExpiresAt
				? Number(row.clientSecretExpiresAt)
				: undefined,
		} as OAuthClientInformationFull;
	}
}
