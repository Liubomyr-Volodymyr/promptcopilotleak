import { BadRequestException } from '@nestjs/common';
import { PromptRequestService } from './prompt-request.service';

const feedbackRepo = { create: jest.fn(), save: jest.fn() };
const contactRepo = { findOne: jest.fn() };
const profileRepo = { findOne: jest.fn() };
const promptRepo = {
	create: jest.fn(),
	save: jest.fn(),
	find: jest.fn(),
	remove: jest.fn(),
	findOne: jest.fn(),
};
const cryptoService = { encrypt: jest.fn(), decrypt: jest.fn() };

describe('PromptRequestService', () => {
	let service: PromptRequestService;

	beforeEach(() => {
		jest.resetAllMocks();
		cryptoService.encrypt.mockReturnValue('encrypted');
		cryptoService.decrypt.mockReturnValue('decrypted prompt');

		service = new PromptRequestService(
			feedbackRepo as any,
			contactRepo as any,
			profileRepo as any,
			promptRepo as any,
			cryptoService as any,
		);
	});

	describe('createFeedback', () => {
		const feedbackDto = {
			original_text: 'original',
			final_text: 'final',
			domain: 'example.com',
			user_feedback: 'upvote',
		} as any;

		it('creates and returns feedback', async () => {
			const user = { id: 1, email: 'a@b.com' };
			const entity = {
				id: 'fb-1',
				user,
				originalText: 'original',
				finalText: 'final' as string | null,
				domain: 'example.com',
				userFeedback: 'upvote',
				profile: null as any,
			};

			contactRepo.findOne.mockResolvedValue(user);
			feedbackRepo.create.mockReturnValue(entity);
			feedbackRepo.save.mockResolvedValue(entity);

			const result = await service.createFeedback(feedbackDto, '1');

			expect(result).toMatchObject({
				user_id: '1',
				original_text: 'original',
				final_text: 'final',
				domain: 'example.com',
				user_feedback: 'upvote',
			});
		});

		it('throws BadRequestException when user is not found', async () => {
			contactRepo.findOne.mockResolvedValue(null);

			await expect(
				service.createFeedback(feedbackDto, '99'),
			).rejects.toThrow(BadRequestException);
		});

		it('throws BadRequestException when profile_id is provided but profile not found', async () => {
			contactRepo.findOne.mockResolvedValue({ id: 1 });
			profileRepo.findOne.mockResolvedValue(null);

			await expect(
				service.createFeedback(
					{ ...feedbackDto, profile_id: '5' },
					'1',
				),
			).rejects.toThrow(BadRequestException);
		});

		it('attaches profile when profile_id is provided and found', async () => {
			const user = { id: 1 };
			const profile = { id: 5 };
			const entity = {
				id: 'fb-2',
				user,
				profile,
				originalText: 'original',
				finalText: 'final',
				domain: 'example.com',
				userFeedback: 'downvote',
			};

			contactRepo.findOne.mockResolvedValue(user);
			profileRepo.findOne.mockResolvedValue(profile);
			feedbackRepo.create.mockReturnValue(entity);
			feedbackRepo.save.mockResolvedValue(entity);

			const result = await service.createFeedback(
				{ ...feedbackDto, profile_id: '5', user_feedback: 'downvote' },
				'1',
			);

			expect(result.profile).toBe('5');
			expect(result.user_feedback).toBe('downvote');
		});

		it('maps unknown user_feedback values to "none"', async () => {
			const user = { id: 1 };
			const entity = {
				id: 'fb-3',
				user,
				profile: null as any,
				originalText: 'o',
				finalText: null as string | null,
				domain: null as string | null,
				userFeedback: 'unknown',
			};

			contactRepo.findOne.mockResolvedValue(user);
			feedbackRepo.create.mockReturnValue(entity);
			feedbackRepo.save.mockResolvedValue(entity);

			const result = await service.createFeedback(
				{ ...feedbackDto, user_feedback: 'unknown' },
				'1',
			);

			expect(result.user_feedback).toBe('none');
		});
	});

	describe('create', () => {
		it('encrypts prompt and saves entity', async () => {
			const saved = {
				id: 'pr-1',
				prompt: 'encrypted',
				userId: 1,
				createdAt: new Date(),
			};
			promptRepo.create.mockReturnValue(saved);
			promptRepo.save.mockResolvedValue(saved);
			promptRepo.find.mockResolvedValue([saved]);

			const result = await service.create(
				{ input: 'my prompt' } as any,
				1,
			);

			expect(cryptoService.encrypt).toHaveBeenCalledWith('my prompt');
			expect(promptRepo.create).toHaveBeenCalledWith({
				prompt: 'encrypted',
				userId: 1,
			});
			expect(result.prompt).toBe('my prompt');
		});

		it('deletes oldest prompts when user has more than 5', async () => {
			const saved = { id: 'pr-1', prompt: 'encrypted', userId: 1 };
			promptRepo.create.mockReturnValue(saved);
			promptRepo.save.mockResolvedValue(saved);

			const existingPrompts = Array.from({ length: 6 }, (_, i) => ({
				id: `pr-${i}`,
				prompt: 'enc',
				userId: 1,
			}));
			promptRepo.find.mockResolvedValue(existingPrompts);
			promptRepo.remove.mockResolvedValue(undefined);

			await service.create({ input: 'new prompt' } as any, 1);

			expect(promptRepo.remove).toHaveBeenCalledWith(
				existingPrompts.slice(5),
			);
		});

		it('does not delete anything when user has 5 or fewer prompts', async () => {
			const saved = { id: 'pr-1', prompt: 'encrypted', userId: 1 };
			promptRepo.create.mockReturnValue(saved);
			promptRepo.save.mockResolvedValue(saved);
			promptRepo.find.mockResolvedValue([saved]);

			await service.create({ input: 'new' } as any, 1);

			expect(promptRepo.remove).not.toHaveBeenCalled();
		});
	});

	describe('findOne', () => {
		it('returns decrypted prompt when entity exists', async () => {
			const entity = { id: 'pr-1', prompt: 'encrypted', userId: 1 };
			promptRepo.findOne.mockResolvedValue(entity);

			const result = await service.findOne('pr-1', 1);

			expect(cryptoService.decrypt).toHaveBeenCalledWith('encrypted');
			expect(result?.prompt).toBe('decrypted prompt');
		});

		it('returns null when entity not found', async () => {
			promptRepo.findOne.mockResolvedValue(null);

			const result = await service.findOne('missing', 1);

			expect(result).toBeNull();
		});
	});

	describe('remove', () => {
		it('removes entity and returns id', async () => {
			const entity = { id: 'pr-1', prompt: 'enc', userId: 1 };
			promptRepo.findOne.mockResolvedValue(entity);
			promptRepo.remove.mockResolvedValue(entity);

			const result = await service.remove('pr-1', 1);

			expect(promptRepo.remove).toHaveBeenCalledWith(entity);
			expect(result).toEqual({ id: 'pr-1' });
		});

		it('returns null when entity not found', async () => {
			promptRepo.findOne.mockResolvedValue(null);

			const result = await service.remove('missing', 1);

			expect(result).toBeNull();
		});
	});
});
