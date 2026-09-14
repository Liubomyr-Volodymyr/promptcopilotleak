import { MemoryAgentService } from './memory-agent.service';

describe('MemoryAgentService', () => {
	let service: MemoryAgentService;

	const repo = {
		findOne: jest.fn(),
		create: jest.fn(),
		save: jest.fn(),
	};

	const crypto = {
		decrypt: jest.fn(),
		encrypt: jest.fn(),
	};

	const midbrain = {
		createAgent: jest.fn(),
		createAgentKey: jest.fn(),
	};

	const mockAgent = {
		id: 'uuid-1',
		userId: 42,
		agentId: 'agent-abc',
		agentSK: 'encrypted-sk',
		name: 'user-42',
		description: 'Personal memory agent',
		ownerId: null as string | null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		jest.clearAllMocks();

		service = new MemoryAgentService(
			repo as any,
			crypto as any,
			midbrain as any,
		);
	});

	describe('getAgent', () => {
		it('returns null when no agent exists for the user', async () => {
			repo.findOne.mockResolvedValue(null);
			crypto.decrypt.mockReturnValue(undefined);

			const result = await service.getAgent('42');

			expect(result).toBeNull();
		});

		it('queries repo with userId converted to number', async () => {
			repo.findOne.mockResolvedValue(null);
			crypto.decrypt.mockReturnValue(undefined);

			await service.getAgent('99');

			expect(repo.findOne).toHaveBeenCalledWith({
				where: { userId: 99 },
			});
		});

		it('returns agent with decrypted SK when agent exists', async () => {
			repo.findOne.mockResolvedValue(mockAgent);
			crypto.decrypt.mockReturnValue('decrypted-sk');

			const result = await service.getAgent('42');

			expect(crypto.decrypt).toHaveBeenCalledWith('encrypted-sk');
			expect(result).toMatchObject({
				...mockAgent,
				agentSK: 'decrypted-sk',
			});
		});

		it('does not mutate the original entity returned from repo', async () => {
			repo.findOne.mockResolvedValue(mockAgent);
			crypto.decrypt.mockReturnValue('decrypted-sk');

			await service.getAgent('42');

			expect(mockAgent.agentSK).toBe('encrypted-sk');
		});
	});

	describe('ensureAgent', () => {
		it('returns existing agent without calling midbrain when agent already exists', async () => {
			repo.findOne.mockResolvedValue(mockAgent);

			const result = await service.ensureAgent(42);

			expect(result).toBe(mockAgent);
			expect(midbrain.createAgent).not.toHaveBeenCalled();
			expect(midbrain.createAgentKey).not.toHaveBeenCalled();
		});

		it('creates remote agent and persists when none exists', async () => {
			repo.findOne.mockResolvedValue(null);
			midbrain.createAgent.mockResolvedValue({
				agent_id: 'new-agent-id',
				name: 'user-42',
				description: 'Personal memory agent',
			});
			midbrain.createAgentKey.mockResolvedValue('raw-sk');
			crypto.encrypt.mockReturnValue('encrypted-new-sk');
			repo.create.mockReturnValue({ userId: 42 });
			repo.save.mockResolvedValue({
				userId: 42,
				agentSK: 'encrypted-new-sk',
			});

			await service.ensureAgent(42);

			expect(midbrain.createAgent).toHaveBeenCalledWith(
				'user-42',
				'Personal memory agent',
			);
			expect(midbrain.createAgentKey).toHaveBeenCalledWith(
				'new-agent-id',
			);
		});

		it('encrypts the raw agent key before saving', async () => {
			repo.findOne.mockResolvedValue(null);
			midbrain.createAgent.mockResolvedValue({
				agent_id: 'new-agent-id',
				name: 'user-42',
				description: 'Personal memory agent',
			});
			midbrain.createAgentKey.mockResolvedValue('raw-sk');
			crypto.encrypt.mockReturnValue('encrypted-new-sk');
			repo.create.mockReturnValue({});
			repo.save.mockResolvedValue({});

			await service.ensureAgent(42);

			expect(crypto.encrypt).toHaveBeenCalledWith('raw-sk');
			expect(repo.create).toHaveBeenCalledWith(
				expect.objectContaining({ agentSK: 'encrypted-new-sk' }),
			);
		});

		it('saves entity with correct fields', async () => {
			repo.findOne.mockResolvedValue(null);
			midbrain.createAgent.mockResolvedValue({
				agent_id: 'new-agent-id',
				name: 'user-42',
				description: 'Personal memory agent',
			});
			midbrain.createAgentKey.mockResolvedValue('raw-sk');
			crypto.encrypt.mockReturnValue('encrypted-new-sk');
			repo.create.mockReturnValue({ prepared: true });
			const savedEntity = { userId: 42, agentId: 'new-agent-id' };
			repo.save.mockResolvedValue(savedEntity);

			const result = await service.ensureAgent(42);

			expect(repo.create).toHaveBeenCalledWith({
				userId: 42,
				agentId: 'new-agent-id',
				profileId: null,
				agentSK: 'encrypted-new-sk',
				name: 'user-42',
				description: 'Personal memory agent',
			});
			expect(repo.save).toHaveBeenCalledWith({ prepared: true });
			expect(result).toBe(savedEntity);
		});

		it('throws when midbrain.createAgent fails', async () => {
			repo.findOne.mockResolvedValue(null);
			midbrain.createAgent.mockRejectedValue(
				new Error('Midbrain unavailable'),
			);

			await expect(service.ensureAgent(42)).rejects.toThrow(
				'Midbrain unavailable',
			);
		});

		it('throws when midbrain.createAgentKey fails', async () => {
			repo.findOne.mockResolvedValue(null);
			midbrain.createAgent.mockResolvedValue({
				agent_id: 'new-agent-id',
				name: 'user-42',
				description: '',
			});
			midbrain.createAgentKey.mockRejectedValue(
				new Error('Key creation failed'),
			);

			await expect(service.ensureAgent(42)).rejects.toThrow(
				'Key creation failed',
			);
		});
	});
});
