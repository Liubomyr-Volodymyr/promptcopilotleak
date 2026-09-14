import { HttpException, HttpStatus } from '@nestjs/common';
import { MemoryConsolidateService } from './memory-consolidate.service';
import { LLMFeatures, LLModel, PROJECT_KEY } from '../../common/enums';

describe('MemoryConsolidateService', () => {
	let service: MemoryConsolidateService;

	const aiService = {
		aiRequest: jest.fn(),
	};

	const midbrain = {
		getProfile: jest.fn(),
		getProcedural: jest.fn(),
		search: jest.fn(),
		getSemantic: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();

		service = new MemoryConsolidateService(
			aiService as any,
			midbrain as any,
		);

		midbrain.getProfile.mockResolvedValue({ description: 'user summary' });
		midbrain.getProcedural.mockResolvedValue({ items: [] });
		midbrain.search.mockResolvedValue([]);
		midbrain.getSemantic.mockResolvedValue({});
	});

	describe('getInjectContext', () => {
		it('returns prompt from profile description', async () => {
			midbrain.getProfile.mockResolvedValue({
				description: 'user is a developer',
			});

			const result = await service.getInjectContext(
				'some input',
				'user-1',
			);

			expect(result).toEqual({ prompt: 'user is a developer' });
		});

		it('returns prompt as undefined when profile has no description', async () => {
			midbrain.getProfile.mockResolvedValue({});

			const result = await service.getInjectContext('input', 'user-1');

			expect(result).toEqual({ prompt: undefined });
		});

		it('calls getProfile with correct userId', async () => {
			await service.getInjectContext('my input', 'user-42');

			expect(midbrain.getProfile).toHaveBeenCalledWith({
				userId: 'user-42',
			});
		});
	});

	describe('getContext', () => {
		describe('when variables list is empty', () => {
			it('returns prompt_body unchanged without calling AI', async () => {
				const result = await service.getContext('user-1', {
					prompt_body: 'Hello world',
					variables: [],
				});

				expect(aiService.aiRequest).not.toHaveBeenCalled();
				expect(result).toEqual({
					prompt: 'Hello world',
					variables: {},
				});
			});
		});

		describe('when variables are provided', () => {
			it('calls aiRequest with correct model and project key', async () => {
				aiService.aiRequest.mockResolvedValue(
					JSON.stringify({ name: 'John' }),
				);

				await service.getContext('user-1', {
					prompt_body: 'Hello {{name}}',
					variables: ['name'],
				});

				expect(aiService.aiRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						model: LLModel.OPENROUTER_QWEN,
						project_key: PROJECT_KEY.CONTEXT,
						feature: LLMFeatures.ENHANCE,
					}),
				);
			});

			it('fills prompt placeholders with AI-generated values', async () => {
				aiService.aiRequest.mockResolvedValue(
					JSON.stringify({ name: 'John', role: 'engineer' }),
				);

				const result = await service.getContext('user-1', {
					prompt_body: 'Hello {{name}}, you are a {{role}}',
					variables: ['name', 'role'],
				});

				expect(result.prompt).toBe('Hello John, you are a engineer');
				expect(result.variables).toEqual({
					name: 'John',
					role: 'engineer',
				});
			});

			it('fetches procedural memory and profile for context', async () => {
				aiService.aiRequest.mockResolvedValue(
					JSON.stringify({ topic: 'AI' }),
				);
				midbrain.getProcedural.mockResolvedValue({
					items: [{ id: 'p1', text: 'procedure' }],
				});

				await service.getContext('user-1', {
					prompt_body: 'Write about {{topic}}',
					variables: ['topic'],
				});

				expect(midbrain.getProcedural).toHaveBeenCalledWith({
					userId: 'user-1',
				});
				expect(midbrain.getProfile).toHaveBeenCalledWith({
					userId: 'user-1',
				});
			});

			it('searches semantic memory using prompt_body as query', async () => {
				aiService.aiRequest.mockResolvedValue(
					JSON.stringify({ topic: 'AI' }),
				);

				await service.getContext('user-1', {
					prompt_body: 'Write about {{topic}}',
					variables: ['topic'],
				});

				expect(midbrain.search).toHaveBeenCalledWith(
					expect.objectContaining({
						userId: 'user-1',
						query: 'Write about {{topic}}',
						limit: 5,
					}),
				);
			});

			it('continues when semantic search fails', async () => {
				midbrain.search.mockRejectedValue(new Error('search down'));
				aiService.aiRequest.mockResolvedValue(
					JSON.stringify({ name: 'John' }),
				);

				const result = await service.getContext('user-1', {
					prompt_body: 'Hello {{name}}',
					variables: ['name'],
				});

				expect(result.prompt).toBe('Hello John');
			});
		});

		describe('error handling', () => {
			it('throws BAD_GATEWAY when AI returns invalid JSON', async () => {
				aiService.aiRequest.mockResolvedValue('not valid json {{}}');

				await expect(
					service.getContext('user-1', {
						prompt_body: 'Hello {{name}}',
						variables: ['name'],
					}),
				).rejects.toMatchObject({
					status: HttpStatus.BAD_GATEWAY,
				});
			});

			it('throws BAD_REQUEST when AI response is missing required variables', async () => {
				aiService.aiRequest.mockResolvedValue(
					JSON.stringify({ unrelated: 'value' }),
				);

				await expect(
					service.getContext('user-1', {
						prompt_body: 'Hello {{name}}',
						variables: ['name'],
					}),
				).rejects.toMatchObject({
					status: HttpStatus.BAD_REQUEST,
				});
			});

			it('re-throws HttpException without wrapping in 500', async () => {
				aiService.aiRequest.mockResolvedValue(
					JSON.stringify({ unrelated: 'value' }),
				);

				const error = await service
					.getContext('user-1', {
						prompt_body: 'Hello {{name}}',
						variables: ['name'],
					})
					.catch((e) => e);

				expect(error).toBeInstanceOf(HttpException);
				expect(error.status).toBe(HttpStatus.BAD_REQUEST);
			});

			it('wraps unexpected errors in 500 HttpException', async () => {
				aiService.aiRequest.mockRejectedValue(
					new Error('network failure'),
				);

				await expect(
					service.getContext('user-1', {
						prompt_body: 'Hello {{name}}',
						variables: ['name'],
					}),
				).rejects.toMatchObject({
					status: HttpStatus.INTERNAL_SERVER_ERROR,
				});
			});
		});
	});
});
