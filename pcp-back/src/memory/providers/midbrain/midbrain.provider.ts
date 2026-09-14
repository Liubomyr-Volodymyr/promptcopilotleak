import { Injectable } from '@nestjs/common';
import { MidbrainClient } from './midbrain.client';
import {
	DeleteMemoryInput,
	MemoryProvider,
	RememberEpisodicMemoryInput,
	SearchMemoryInput,
	GetEpisodicMemoryInput,
} from '../interfaces';
import { MemoryAgentService } from '../../services/memory-agent.service';

@Injectable()
export class MidbrainProvider implements MemoryProvider {
	constructor(
		private readonly client: MidbrainClient,
		private readonly agentService: MemoryAgentService,
	) {}

	async getProfile(input: SearchMemoryInput) {
		const agent = await this.agentService.getAgent(
			input.userId,
			input.profileId ?? null,
		);
		if (!agent?.agentId || !agent?.agentSK) return [];

		return await this.client.getAgentProfile(agent.agentSK, agent.agentId);
	}

	async search(input: SearchMemoryInput) {
		const agent = await this.agentService.getAgent(
			input.userId,
			input.profileId ?? null,
		);
		if (!agent?.agentId || !agent?.agentSK) return [];

		return this.client.searchSemantic(agent.agentSK, agent.agentId, {
			query: input.query,
			limit: input.limit ?? 10,
		});
	}

	async getSemantic(input: SearchMemoryInput) {
		const agent = await this.agentService.getAgent(
			input.userId,
			input.profileId ?? null,
		);
		if (!agent?.agentId || !agent?.agentSK) return [];

		return this.client.getSemanticMemories(agent.agentSK, agent.agentId);
	}

	async getProcedural(input: { userId: string; profileId?: string | null }) {
		const agent = await this.agentService.getAgent(
			input.userId,
			input.profileId ?? null,
		);
		if (!agent?.agentId || !agent?.agentSK) return [];

		return this.client.getProceduralMemories(agent.agentSK, agent.agentId);
	}

	async getEpisodic(input: GetEpisodicMemoryInput) {
		const agent = await this.agentService.getAgent(
			input.userId,
			input.profileId ?? null,
		);
		if (!agent?.agentId || !agent?.agentSK) return [];

		return this.client.getEpisodicMemories(
			agent.agentSK,
			agent.agentId,
			input.conversationId,
			input.limit,
		);
	}

	async remember(
		userId: string,
		episodicRecord: RememberEpisodicMemoryInput,
		profileId: string | null = null,
	) {
		try {
			const agent = await this.agentService.resolveAgent(
				Number(userId),
				profileId,
			);
			if (!agent?.agentId || !agent?.agentSK) return;

			await this.client.remember(
				agent.agentSK,
				agent.agentId,
				episodicRecord,
			);
		} catch {
			// non-critical
		}
	}

	async delete(input: DeleteMemoryInput) {
		try {
			const agent = await this.agentService.getAgent(
				input.userId,
				input.profileId ?? null,
			);
			if (!agent?.agentId || !agent?.agentSK) return;

			await this.client.delete(agent.agentSK, agent.agentId, input);
		} catch {
			// ignore
		}
	}

	async uploadDocument(input: {
		userId: string;
		text: string;
		fileName: string;
		profileId: number;
	}): Promise<void> {
		return this.writeProfileSemanticMemory({
			userId: input.userId,
			profileId: input.profileId,
			text: input.text,
			source: input.fileName,
			metadata: {
				file_name: input.fileName,
				profile_id: String(input.profileId),
				type: 'document',
			},
		});
	}

	async uploadLinkContext(input: {
		userId: string;
		profileId: number;
		url: string;
		text: string;
		metadata?: Record<string, any>;
	}): Promise<void> {
		return this.writeProfileSemanticMemory({
			userId: input.userId,
			profileId: input.profileId,
			text: input.text,
			source: input.url,
			metadata: {
				url: input.url,
				profile_id: String(input.profileId),
				type: 'link',
				...input.metadata,
			},
		});
	}

	private async writeProfileSemanticMemory(input: {
		userId: string;
		profileId: number;
		text: string;
		source: string;
		metadata: Record<string, any>;
	}): Promise<void> {
		try {
			const profileAgent = await this.agentService.resolveAgent(
				Number(input.userId),
				String(input.profileId),
			);
			if (!profileAgent?.agentId || !profileAgent?.agentSK) return;

			await this.client.createSemanticMemory(
				profileAgent.agentSK,
				profileAgent.agentId,
				{
					text: input.text,
					source: input.source,
					memory_metadata: input.metadata,
				},
			);
		} catch {
			// non-critical
		}
	}
}
