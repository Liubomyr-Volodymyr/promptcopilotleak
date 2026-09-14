import { MidbrainProvider } from './midbrain.provider';

describe('MidbrainProvider', () => {
	let provider: MidbrainProvider;

	const client = {
		getAgentProfile: jest.fn(),
		searchSemantic: jest.fn(),
		getSemanticMemories: jest.fn(),
		getProceduralMemories: jest.fn(),
		getEpisodicMemories: jest.fn(),
		remember: jest.fn(),
		delete: jest.fn(),
		createSemanticMemory: jest.fn(),
	};

	const agentService = {
		getAgent: jest.fn(),
		resolveAgent: jest.fn(),
	};

	const mockAgent = {
		agentId: 'agent-abc',
		agentSK: 'sk-tok',
	};

	beforeEach(() => {
		jest.clearAllMocks();

		provider = new MidbrainProvider(client as any, agentService as any);

		agentService.getAgent.mockResolvedValue(mockAgent);
	});

	describe('early return when agent is missing', () => {
		const noAgentCases = [
			null,
			{ agentId: null as string | null, agentSK: 'sk' },
			{ agentId: 'id', agentSK: null as string | null },
		];

		it.each(noAgentCases)(
			'getProfile returns [] when agent is %p',
			async (agent) => {
				agentService.getAgent.mockResolvedValue(agent);
				const result = await provider.getProfile({
					userId: '1',
				} as any);
				expect(result).toEqual([]);
				expect(client.getAgentProfile).not.toHaveBeenCalled();
			},
		);

		it.each(noAgentCases)(
			'search returns [] when agent is %p',
			async (agent) => {
				agentService.getAgent.mockResolvedValue(agent);
				const result = await provider.search({
					query: 'x',
					userId: '1',
				});
				expect(result).toEqual([]);
				expect(client.searchSemantic).not.toHaveBeenCalled();
			},
		);

		it.each(noAgentCases)(
			'getSemantic returns [] when agent is %p',
			async (agent) => {
				agentService.getAgent.mockResolvedValue(agent);
				const result = await provider.getSemantic({
					userId: '1',
				} as any);
				expect(result).toEqual([]);
				expect(client.getSemanticMemories).not.toHaveBeenCalled();
			},
		);

		it.each(noAgentCases)(
			'getProcedural returns [] when agent is %p',
			async (agent) => {
				agentService.getAgent.mockResolvedValue(agent);
				const result = await provider.getProcedural({ userId: '1' });
				expect(result).toEqual([]);
				expect(client.getProceduralMemories).not.toHaveBeenCalled();
			},
		);

		it.each(noAgentCases)(
			'getEpisodic returns [] when agent is %p',
			async (agent) => {
				agentService.getAgent.mockResolvedValue(agent);
				const result = await provider.getEpisodic({
					userId: '1',
					conversationId: 'conv-1',
				});
				expect(result).toEqual([]);
				expect(client.getEpisodicMemories).not.toHaveBeenCalled();
			},
		);

		it.each(noAgentCases)(
			'remember returns undefined when agent is %p',
			async (agent) => {
				agentService.getAgent.mockResolvedValue(agent);
				const result = await provider.remember('1', {
					text: 'msg',
					memory_metadata: {},
					occurred_at: '2024-01-01',
				});
				expect(result).toBeUndefined();
				expect(client.remember).not.toHaveBeenCalled();
			},
		);

		it.each(noAgentCases)(
			'uploadDocument returns when agent is %p',
			async (agent) => {
				agentService.getAgent.mockResolvedValue(agent);
				await provider.uploadDocument({
					userId: '1',
					text: 'doc',
					fileName: 'file.pdf',
					profileId: 1,
				});
				expect(client.createSemanticMemory).not.toHaveBeenCalled();
			},
		);
	});

	describe('getProfile', () => {
		it('calls getAgentProfile with agent credentials', async () => {
			const profile = { description: 'user summary' };
			client.getAgentProfile.mockResolvedValue(profile);

			const result = await provider.getProfile({ userId: '42' } as any);

			expect(agentService.getAgent).toHaveBeenCalledWith('42', null);
			expect(client.getAgentProfile).toHaveBeenCalledWith(
				'sk-tok',
				'agent-abc',
			);
			expect(result).toBe(profile);
		});
	});

	describe('search', () => {
		it('calls searchSemantic with query and limit', async () => {
			const records = [{ id: 'm1', content: 'result' }];
			client.searchSemantic.mockResolvedValue(records);

			const result = await provider.search({
				userId: '42',
				query: 'test query',
				limit: 3,
			});

			expect(client.searchSemantic).toHaveBeenCalledWith(
				'sk-tok',
				'agent-abc',
				{ query: 'test query', limit: 3 },
			);
			expect(result).toBe(records);
		});

		it('defaults limit to 10 when not provided', async () => {
			client.searchSemantic.mockResolvedValue([]);

			await provider.search({ userId: '42', query: 'x' });

			expect(client.searchSemantic).toHaveBeenCalledWith(
				'sk-tok',
				'agent-abc',
				expect.objectContaining({ limit: 10 }),
			);
		});
	});

	describe('getSemantic', () => {
		it('calls getSemanticMemories with agent credentials', async () => {
			const data = { items: [{ id: 's1' }] };
			client.getSemanticMemories.mockResolvedValue(data);

			const result = await provider.getSemantic({ userId: '42' } as any);

			expect(client.getSemanticMemories).toHaveBeenCalledWith(
				'sk-tok',
				'agent-abc',
			);
			expect(result).toBe(data);
		});
	});

	describe('getProcedural', () => {
		it('calls getProceduralMemories with agent credentials', async () => {
			const data = { items: [{ id: 'p1' }] };
			client.getProceduralMemories.mockResolvedValue(data);

			const result = await provider.getProcedural({ userId: '42' });

			expect(client.getProceduralMemories).toHaveBeenCalledWith(
				'sk-tok',
				'agent-abc',
			);
			expect(result).toBe(data);
		});
	});

	describe('getEpisodic', () => {
		it('calls getEpisodicMemories with conversationId and limit', async () => {
			const records = [{ id: 'e1', content: 'msg' }];
			client.getEpisodicMemories.mockResolvedValue(records);

			const result = await provider.getEpisodic({
				userId: '42',
				conversationId: 'conv-1',
				limit: 5,
			});

			expect(client.getEpisodicMemories).toHaveBeenCalledWith(
				'sk-tok',
				'agent-abc',
				'conv-1',
				5,
			);
			expect(result).toBe(records);
		});
	});

	describe('remember', () => {
		it('calls client.remember with agent credentials and payload', async () => {
			client.remember.mockResolvedValue(undefined);
			agentService.resolveAgent.mockResolvedValue(mockAgent);

			const payload = {
				text: 'user typed hello',
				role: 'user',
				memory_metadata: { conversation_id: 'conv-1' },
				occurred_at: '2024-01-01T00:00:00Z',
			};

			await provider.remember('42', payload);

			expect(client.remember).toHaveBeenCalledWith(
				'sk-tok',
				'agent-abc',
				payload,
			);
		});

		it('swallows errors silently', async () => {
			client.remember.mockRejectedValue(new Error('network error'));

			await expect(
				provider.remember('42', {
					text: 'msg',
					memory_metadata: {},
					occurred_at: '2024-01-01',
				}),
			).resolves.toBeUndefined();
		});
	});

	describe('delete', () => {
		it('calls client.delete with agent credentials and input', async () => {
			client.delete.mockResolvedValue(undefined);

			await provider.delete({ userId: '42', memoryId: 'mem-1' });

			expect(client.delete).toHaveBeenCalledWith('sk-tok', 'agent-abc', {
				userId: '42',
				memoryId: 'mem-1',
			});
		});

		it('swallows errors silently', async () => {
			client.delete.mockRejectedValue(new Error('delete failed'));

			await expect(
				provider.delete({ userId: '42' }),
			).resolves.toBeUndefined();
		});
	});

	describe('uploadDocument', () => {
		it('calls createSemanticMemory with correct payload', async () => {
			client.createSemanticMemory.mockResolvedValue(undefined);

			await provider.uploadDocument({
				userId: '42',
				text: 'document content',
				fileName: 'report.pdf',
				profileId: 7,
			});

			expect(client.createSemanticMemory).toHaveBeenCalledWith(
				'sk-tok',
				'agent-abc',
				{
					text: 'document content',
					source: 'report.pdf',
					memory_metadata: {
						file_name: 'report.pdf',
						profile_id: '7',
						type: 'document',
					},
				},
			);
		});

		it('swallows errors silently', async () => {
			client.createSemanticMemory.mockRejectedValue(
				new Error('upload failed'),
			);

			await expect(
				provider.uploadDocument({
					userId: '42',
					text: 'doc',
					fileName: 'f.pdf',
					profileId: 1,
				}),
			).resolves.toBeUndefined();
		});
	});
});
