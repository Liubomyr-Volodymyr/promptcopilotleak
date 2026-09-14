import axios from 'axios';
import { BadGatewayException, HttpException } from '@nestjs/common';
import { MidbrainClient } from './midbrain.client';

jest.mock('axios');

const mockedAxiosCreate = axios.create as jest.Mock;

describe('MidbrainClient', () => {
	let service: MidbrainClient;
	let mockOwnerAxios: { post: jest.Mock; get: jest.Mock; delete: jest.Mock };
	let mockAgentAxios: { post: jest.Mock; get: jest.Mock; delete: jest.Mock };

	const configService = {
		get: jest.fn().mockReturnValue('http://midbrain.test'),
	};

	beforeEach(() => {
		jest.clearAllMocks();

		mockOwnerAxios = {
			post: jest.fn(),
			get: jest.fn(),
			delete: jest.fn(),
		};
		mockAgentAxios = {
			post: jest.fn(),
			get: jest.fn(),
			delete: jest.fn(),
		};

		mockedAxiosCreate
			.mockReturnValueOnce(mockOwnerAxios)
			.mockReturnValue(mockAgentAxios);

		service = new MidbrainClient(configService as any);
	});

	describe('createAgent', () => {
		it('posts to /account/agents and returns the created agent', async () => {
			const remote = { agent_id: 'a1', name: 'user-1', description: '' };
			mockOwnerAxios.post.mockResolvedValue({ data: remote });

			const result = await service.createAgent('user-1', 'desc');

			expect(mockOwnerAxios.post).toHaveBeenCalledWith(
				'/account/agents',
				{
					name: 'user-1',
					description: 'desc',
				},
			);
			expect(result).toBe(remote);
		});

		it('defaults description to empty string', async () => {
			mockOwnerAxios.post.mockResolvedValue({ data: {} });

			await service.createAgent('user-1');

			expect(mockOwnerAxios.post).toHaveBeenCalledWith(
				'/account/agents',
				expect.objectContaining({ description: '' }),
			);
		});

		it('throws BadGatewayException when request fails', async () => {
			mockOwnerAxios.post.mockRejectedValue({
				response: { status: 503 },
			});

			await expect(service.createAgent('user-1')).rejects.toThrow(
				BadGatewayException,
			);
		});
	});

	describe('createAgentKey', () => {
		it('posts to /account/keys and returns the key string', async () => {
			mockOwnerAxios.post.mockResolvedValue({ data: { key: 'sk-123' } });

			const result = await service.createAgentKey('agent-1');

			expect(mockOwnerAxios.post).toHaveBeenCalledWith('/account/keys', {
				key_alias: 'agent-1-key',
				agent_id: 'agent-1',
				max_budget: 5,
			});
			expect(result).toBe('sk-123');
		});

		it('throws BadGatewayException when request fails', async () => {
			mockOwnerAxios.post.mockRejectedValue({
				response: { status: 500 },
			});

			await expect(service.createAgentKey('agent-1')).rejects.toThrow(
				BadGatewayException,
			);
		});
	});

	describe('getAgentProfile', () => {
		it('calls GET /profile with agent_id param and returns data', async () => {
			const profile = { description: 'user summary' };
			mockAgentAxios.get.mockResolvedValue({ data: profile });

			const result = await service.getAgentProfile('sk-tok', 'agent-1');

			expect(mockAgentAxios.get).toHaveBeenCalledWith('/profile', {
				params: { agent_id: 'agent-1' },
			});
			expect(result).toBe(profile);
		});

		it('returns undefined silently on error', async () => {
			mockAgentAxios.get.mockRejectedValue({ response: { status: 404 } });

			const result = await service.getAgentProfile('sk-tok', 'agent-1');

			expect(result).toBeUndefined();
		});
	});

	describe('getSemanticMemories', () => {
		it('calls GET /memories/semantic and returns data', async () => {
			const items = [{ id: 's1', text: 'doc content' }];
			mockAgentAxios.get.mockResolvedValue({ data: items });

			const result = await service.getSemanticMemories(
				'sk-tok',
				'agent-1',
			);

			expect(mockAgentAxios.get).toHaveBeenCalledWith(
				'/memories/semantic',
				expect.objectContaining({
					params: expect.objectContaining({ agent_id: 'agent-1' }),
				}),
			);
			expect(result).toBe(items);
		});

		it('returns [] on error', async () => {
			mockAgentAxios.get.mockRejectedValue({ response: { status: 500 } });

			const result = await service.getSemanticMemories(
				'sk-tok',
				'agent-1',
			);

			expect(result).toEqual([]);
		});
	});

	describe('getProceduralMemories', () => {
		it('calls GET /memories/procedural and returns data', async () => {
			const payload = { items: [{ id: 'p1' }] };
			mockAgentAxios.get.mockResolvedValue({ data: payload });

			const result = await service.getProceduralMemories(
				'sk-tok',
				'agent-1',
			);

			expect(mockAgentAxios.get).toHaveBeenCalledWith(
				'/memories/procedural',
				expect.objectContaining({
					params: expect.objectContaining({ agent_id: 'agent-1' }),
				}),
			);
			expect(result).toBe(payload);
		});

		it('returns { items: [] } on error', async () => {
			mockAgentAxios.get.mockRejectedValue({ response: { status: 500 } });

			const result = await service.getProceduralMemories(
				'sk-tok',
				'agent-1',
			);

			expect(result).toEqual({ items: [] });
		});
	});

	describe('searchSemantic', () => {
		it('maps array response to MemoryRecord[]', async () => {
			const raw = [
				{
					id: 'm1',
					text: 'hello',
					type: 'semantic',
					score: 0.9,
					memory_metadata: { k: 'v' },
					occurred_at: '2024-01-01T00:00:00Z',
				},
			];
			mockAgentAxios.get.mockResolvedValue({ data: raw });

			const result = await service.searchSemantic('sk-tok', 'agent-1', {
				query: 'hello',
				limit: 5,
			});

			expect(result).toEqual([
				{
					id: 'm1',
					content: 'hello',
					type: 'semantic',
					score: 0.9,
					metadata: { k: 'v' },
					createdAt: new Date('2024-01-01T00:00:00Z'),
				},
			]);
		});

		it('maps object response with items array', async () => {
			const raw = {
				items: [
					{ id: 'm2', text: 'world', type: 'episodic', score: 0.5 },
				],
			};
			mockAgentAxios.get.mockResolvedValue({ data: raw });

			const result = await service.searchSemantic('sk-tok', 'agent-1', {
				query: 'world',
			});

			expect(result[0].id).toBe('m2');
			expect(result[0].content).toBe('world');
		});

		it('falls back to 0 score when score is missing', async () => {
			mockAgentAxios.get.mockResolvedValue({
				data: [{ id: 'm3', text: 'no score' }],
			});

			const [record] = await service.searchSemantic('sk-tok', 'agent-1', {
				query: 'x',
			});

			expect(record.score).toBe(0);
		});

		it('returns [] on error', async () => {
			mockAgentAxios.get.mockRejectedValue({ response: { status: 500 } });

			const result = await service.searchSemantic('sk-tok', 'agent-1', {
				query: 'x',
			});

			expect(result).toEqual([]);
		});
	});

	describe('getEpisodicMemories', () => {
		it('maps items from response and returns MemoryRecord[]', async () => {
			const raw = {
				items: [
					{
						id: 'e1',
						text: 'chat msg',
						type: 'episodic',
						score: 0.8,
					},
				],
			};
			mockAgentAxios.get.mockResolvedValue({ data: raw });

			const result = await service.getEpisodicMemories(
				'sk-tok',
				'agent-1',
				'conv-1',
				5,
			);

			expect(mockAgentAxios.get).toHaveBeenCalledWith(
				'/memories/episodic',
				expect.objectContaining({
					params: expect.objectContaining({
						agent_id: 'agent-1',
						'memory_metadata.conversation_id': 'conv-1',
						limit: 5,
					}),
				}),
			);
			expect(result[0].id).toBe('e1');
		});

		it('returns [] when response has no items array', async () => {
			mockAgentAxios.get.mockResolvedValue({ data: null });

			const result = await service.getEpisodicMemories(
				'sk-tok',
				'agent-1',
				'conv-1',
			);

			expect(result).toEqual([]);
		});

		it('returns [] on error', async () => {
			mockAgentAxios.get.mockRejectedValue({ response: { status: 500 } });

			const result = await service.getEpisodicMemories(
				'sk-tok',
				'agent-1',
				'conv-1',
			);

			expect(result).toEqual([]);
		});
	});

	describe('remember', () => {
		const payload = {
			text: 'user typed something',
			role: 'user',
			memory_metadata: { conversation_id: 'conv-1' },
			occurred_at: '2024-01-01T00:00:00Z',
		};

		it('posts to /memories/episodic with agent_id param', async () => {
			mockAgentAxios.post.mockResolvedValue({ data: {} });

			await service.remember('sk-tok', 'agent-1', payload);

			expect(mockAgentAxios.post).toHaveBeenCalledWith(
				'/memories/episodic',
				payload,
				expect.objectContaining({ params: { agent_id: 'agent-1' } }),
			);
		});

		it('throws HttpException when request fails', async () => {
			mockAgentAxios.post.mockRejectedValue({
				response: {
					status: 422,
					data: { detail: [{ loc: 'body.text' }] },
				},
			});

			await expect(
				service.remember('sk-tok', 'agent-1', payload),
			).rejects.toThrow(HttpException);
		});
	});

	describe('createSemanticMemory', () => {
		it('posts to /memories/semantic with correct body', async () => {
			mockAgentAxios.post.mockResolvedValue({ data: {} });

			await service.createSemanticMemory('sk-tok', 'agent-1', {
				text: 'document content',
				source: 'file.pdf',
				memory_metadata: { type: 'document' },
			});

			expect(mockAgentAxios.post).toHaveBeenCalledWith(
				'/memories/semantic',
				expect.objectContaining({
					text: 'document content',
					source: 'file.pdf',
					role: 'external',
					line_start: 0,
					memory_metadata: { type: 'document' },
				}),
				expect.objectContaining({ params: { agent_id: 'agent-1' } }),
			);
		});

		it('does not throw on error', async () => {
			mockAgentAxios.post.mockRejectedValue({
				response: { status: 500 },
			});

			await expect(
				service.createSemanticMemory('sk-tok', 'agent-1', {
					text: 'content',
				}),
			).resolves.toBeUndefined();
		});
	});

	describe('dream', () => {
		it('posts to /dream with incremental strategy by default', async () => {
			mockAgentAxios.post.mockResolvedValue({ data: {} });

			await service.dream('sk-tok', 'agent-1');

			expect(mockAgentAxios.post).toHaveBeenCalledWith('/dream', {
				agent_id: 'agent-1',
				strategy: 'incremental',
			});
		});

		it('passes custom strategy when provided', async () => {
			mockAgentAxios.post.mockResolvedValue({ data: {} });

			await service.dream('sk-tok', 'agent-1', { strategy: 'full' });

			expect(mockAgentAxios.post).toHaveBeenCalledWith(
				'/dream',
				expect.objectContaining({ strategy: 'full' }),
			);
		});

		it('does not throw on error', async () => {
			mockAgentAxios.post.mockRejectedValue({
				response: { status: 500 },
			});

			await expect(
				service.dream('sk-tok', 'agent-1'),
			).resolves.toBeUndefined();
		});
	});

	describe('delete', () => {
		it('calls DELETE /memories/:id when memoryId is provided', async () => {
			mockAgentAxios.delete.mockResolvedValue({ data: {} });

			await service.delete('sk-tok', 'agent-1', {
				userId: '42',
				memoryId: 'mem-1',
			});

			expect(mockAgentAxios.delete).toHaveBeenCalledWith(
				'/memories/mem-1',
				expect.objectContaining({ params: { agent_id: 'agent-1' } }),
			);
		});

		it('calls POST /memories/delete when no memoryId', async () => {
			mockAgentAxios.post.mockResolvedValue({ data: {} });

			await service.delete('sk-tok', 'agent-1', {
				userId: '42',
				type: 'episodic',
			});

			expect(mockAgentAxios.post).toHaveBeenCalledWith(
				'/memories/delete',
				expect.objectContaining({
					agent_id: 'agent-1',
					type: 'episodic',
				}),
			);
		});

		it('does not throw on error', async () => {
			mockAgentAxios.delete.mockRejectedValue({
				response: { status: 500 },
			});

			await expect(
				service.delete('sk-tok', 'agent-1', {
					userId: '42',
					memoryId: 'x',
				}),
			).resolves.toBeUndefined();
		});
	});
});
