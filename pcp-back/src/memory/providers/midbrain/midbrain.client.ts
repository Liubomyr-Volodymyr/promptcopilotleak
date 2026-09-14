import { Injectable, HttpException, BadGatewayException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { CONFIG } from '../../../config/enums';

import {
	DeleteMemoryInput,
	MemoryRecord,
	RememberEpisodicMemoryInput,
	SearchMemoryInput,
	ICreatedAgent,
} from '../interfaces';

@Injectable()
export class MidbrainClient {
	private readonly ownerClient: AxiosInstance;
	private readonly MIDBRAIN_TIMEOUT = 10000;

	constructor(private readonly config: ConfigService) {
		this.ownerClient = axios.create({
			baseURL: this.config.get<string>(CONFIG.MIDBRAIN_API_URL),
			timeout: this.MIDBRAIN_TIMEOUT,
			headers: {
				Authorization: `Bearer ${process.env.MIDBRAIN_API_KEY}`,
				'Content-Type': 'application/json',
			},
		});
	}

	async createAgent(name: string, description = ''): Promise<ICreatedAgent> {
		try {
			const { data } = await this.ownerClient.post('/account/agents', {
				name,
				description,
			});

			return data;
		} catch (error: any) {
			console.error('[Midbrain.createAgent.error]', {
				status: error?.response?.status,
				data: error?.response?.data,
			});

			throw new BadGatewayException('Failed to create Midbrain agent');
		}
	}

	async createAgentKey(agentId: string): Promise<string> {
		try {
			const { data } = await this.ownerClient.post('/account/keys', {
				key_alias: `${agentId}-key`,
				agent_id: agentId,
				max_budget: 5,
			});

			return data.key;
		} catch (error: any) {
			console.error('[Midbrain.createAgentKey.error]', {
				status: error?.response?.status,
				data: error?.response?.data,
			});

			throw new BadGatewayException('Failed to create agent key');
		}
	}

	private createAgentClient(agentToken: string): AxiosInstance {
		return axios.create({
			baseURL: this.config.get<string>(CONFIG.MIDBRAIN_API_URL),
			timeout: this.MIDBRAIN_TIMEOUT,
			headers: {
				Authorization: `Bearer ${agentToken}`,
				'Content-Type': 'application/json',
			},
		});
	}

	async getAgentProfile(agentToken: string, agentId: string): Promise<any> {
		const client = this.createAgentClient(agentToken);

		try {
			const { data } = await client.get('/profile', {
				params: { agent_id: agentId },
			});
			return data;
		} catch (error: any) {
			console.error('[Midbrain.getAgentProfile.error]', {
				status: error?.response?.status,
				data: error?.response?.data,
			});
		}
	}

	async getSemanticMemories(agentToken: string, agentId: string) {
		try {
			const client = this.createAgentClient(agentToken);

			const { data } = await client.get('/memories/semantic', {
				params: {
					agent_id: agentId,
					limit: 10,
					page: 1,
				},
			});

			return data;
		} catch (error: any) {
			console.error('[Midbrain.semantic.error]', {
				status: error?.response?.status,
				data: error?.response?.data,
			});

			return [];
		}
	}

	async getProceduralMemories(agentToken: string, agentId: string) {
		try {
			const client = this.createAgentClient(agentToken);

			const { data } = await client.get('/memories/procedural', {
				params: {
					agent_id: agentId,
					limit: 10,
				},
			});

			return data;
		} catch (error: any) {
			console.error('[Midbrain.procedural.error]', {
				status: error?.response?.status,
				data: error?.response?.data,
			});

			return { items: [] };
		}
	}

	async searchSemantic(
		agentToken: string,
		agentId: string,
		payload: SearchMemoryInput,
	): Promise<MemoryRecord[]> {
		try {
			const client = this.createAgentClient(agentToken);

			const { data } = await client.get('/memories/search/semantic', {
				params: {
					agent_id: agentId,
					query: payload.query,
					limit: payload.limit ?? 10,
				},
			});

			const items = Array.isArray(data) ? data : (data?.items || []);

			return items.map((m: any) => this.mapMemory(m));
		} catch (error: any) {
			console.error('[Midbrain.semantic.error]', {
				status: error?.response?.status,
				data: error?.response?.data,
			});

			return [];
		}
	}

	async getEpisodicMemories(
		agentToken: string,
		agentId: string,
		conversationId: string,
		limit: number = 5,
	): Promise<MemoryRecord[]> {
		try {
			const client = this.createAgentClient(agentToken);

			const { data } = await client.get('/memories/episodic', {
				params: {
					agent_id: agentId,
					'memory_metadata.conversation_id': conversationId,
					limit,
				},
			});

			if (!data || !Array.isArray(data.items)) return [];

			return data.items.map((m: any) => this.mapMemory(m));
		} catch (error: any) {
			console.error('[Midbrain.episodic.error]', {
				status: error?.response?.status,
				data: error?.response?.data,
			});

			return [];
		}
	}

	async remember(
		agentToken: string,
		agentId: string,
		payload: RememberEpisodicMemoryInput,
	): Promise<void> {
		try {
			const client = this.createAgentClient(agentToken);

			await client.post('/memories/episodic', payload, {
				params: { agent_id: agentId },
			});
		} catch (error: any) {
			console.error('[Midbrain.remember.error]', {
				status: error?.response?.status,
				data: error?.response?.data.detail[0].loc,
			});

			throw new HttpException(
				'Failed to store episodic memory',
				error?.response?.status || 500,
			);
		}
	}

	async createSemanticMemory(
		agentToken: string,
		agentId: string,
		payload: {
			text: string;
			source?: string;
			memory_metadata?: Record<string, string>;
		},
	): Promise<void> {
		try {
			const client = this.createAgentClient(agentToken);

			await client.post(
				'/memories/semantic',
				{
					text: payload.text,
					source: payload.source,
					role: 'external',
					line_start: 0,
					memory_metadata: payload.memory_metadata ?? {},
				},
				{
					params: { agent_id: agentId },
					timeout: 30000, // 30s — documents can be large
				},
			);
		} catch (error: any) {
			console.error('[Midbrain.createSemanticMemory.error]', {
				status: error?.response?.status,
				data: JSON.stringify(error?.response?.data, null, 2),
			});
		}
	}

	async dream(
		agentToken: string,
		agentId: string,
		input?: {
			strategy?: 'full' | 'incremental' | 'selective';
		},
	): Promise<void> {
		try {
			const client = this.createAgentClient(agentToken);

			await client.post('/dream', {
				agent_id: agentId,
				strategy: input?.strategy ?? 'incremental',
			});
		} catch (error: any) {
			console.error('[Midbrain.dream.error]', {
				status: error?.response?.status,
				data: error?.response?.data,
			});
		}
	}

	async delete(
		agentToken: string,
		agentId: string,
		input: DeleteMemoryInput,
	): Promise<void> {
		try {
			const client = this.createAgentClient(agentToken);

			if (input.memoryId) {
				await client.delete(`/memories/${input.memoryId}`, {
					params: { agent_id: agentId },
				});
				return;
			}

			await client.post('/memories/delete', {
				...input,
				agent_id: agentId,
			});
		} catch (error: any) {
			console.error('[Midbrain.delete.error]', {
				status: error?.response?.status,
				data: error?.response?.data,
			});
		}
	}

	private mapMemory(raw: any): MemoryRecord {
		return {
			id: raw.id,
			content: raw.text ?? '',
			type: raw.type ?? 'semantic',
			score: typeof raw.score === 'number' ? raw.score : 0,
			metadata: raw.memory_metadata ?? {},
			createdAt: raw.occurred_at ? new Date(raw.occurred_at) : null,
		};
	}
}
