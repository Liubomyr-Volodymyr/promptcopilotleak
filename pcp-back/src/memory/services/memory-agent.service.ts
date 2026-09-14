import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemoryAgent } from '../entities/memory-agent.entity';
import { Repository } from 'typeorm';
import { MidbrainClient } from '../providers/midbrain/midbrain.client';
import { CryptoService } from '../../crypto/services/crypto.service';

@Injectable()
export class MemoryAgentService {
	constructor(
		@InjectRepository(MemoryAgent)
		private readonly repo: Repository<MemoryAgent>,

		private readonly crypto: CryptoService,
		private readonly midbrain: MidbrainClient,
	) {}

	async getAgent(
		userId: string,
		profileId: string | null,
	): Promise<MemoryAgent | null> {
		const agent = await this.repo.findOne({
			where: { userId: Number(userId), profileId },
		});

		if (!agent) return null;

		return { ...agent, agentSK: this.crypto.decrypt(agent.agentSK) };
	}

	/**
	 * Ensures the right agent exists (profile agent when profileId is given,
	 * personal agent otherwise) and returns it with a decrypted key.
	 */
	async resolveAgent(
		userId: number,
		profileId: string | null,
	): Promise<MemoryAgent> {
		const entity = profileId
			? await this.ensureProfileAgentExists(userId, profileId)
			: await this.ensureAgent(userId);

		return { ...entity, agentSK: this.crypto.decrypt(entity.agentSK) };
	}

	async ensureAgent(userId: number): Promise<MemoryAgent> {
		const existing = await this.repo.findOne({
			where: { userId, profileId: null },
		});

		if (existing) return existing;

		const remoteAgent = await this.midbrain.createAgent(
			`user-${userId}`,
			`Personal memory agent`,
		);

		const encryptedAgentSk = await this.createEncryptedAgentKey(
			remoteAgent.agent_id,
		);

		const entity = this.repo.create({
			userId,
			agentId: remoteAgent.agent_id,
			profileId: null,
			agentSK: encryptedAgentSk,
			name: remoteAgent.name,
			description: remoteAgent.description,
		});
		return this.repo.save(entity);
	}

	async ensureProfileAgentExists(
		userId: number,
		profileId: string,
	): Promise<MemoryAgent | null> {
		const existing = await this.repo.findOne({
			where: { userId, profileId },
		});

		if (existing) return existing;

		const remoteAgent = await this.midbrain.createAgent(
			`user-${userId}-profile-${profileId}`,
			`Personal memory profile agent`,
		);

		const encryptedAgentSk = await this.createEncryptedAgentKey(
			remoteAgent.agent_id,
		);

		const entity = this.repo.create({
			userId,
			agentId: remoteAgent.agent_id,
			profileId: profileId,
			agentSK: encryptedAgentSk,
			name: remoteAgent.name,
			description: remoteAgent.description,
		});
		return this.repo.save(entity);
	}

	private async createEncryptedAgentKey(agentId: string) {
		const agentSk = await this.midbrain.createAgentKey(agentId);
		return this.crypto.encrypt(agentSk);
	}
}
