import { MemoryStoreService } from './memory-store.service';

const provider = { remember: jest.fn() };

describe('MemoryStoreService', () => {
	let service: MemoryStoreService;

	beforeEach(() => {
		jest.resetAllMocks();
		provider.remember.mockResolvedValue(undefined);
		service = new MemoryStoreService(provider as any);
	});

	describe('ingestCompletionRequest', () => {
		it('calls ingestAutocompleteAccepted when dto.accepted is true', async () => {
			const dto = {
				input: 'I am writing',
				completion: 'an email',
				accepted: true,
				finalText: 'I am writing an email',
				acceptedChars: 8,
				conversationId: 'conv-1',
			} as any;

			await service.ingestCompletionRequest('1', dto);

			expect(provider.remember).toHaveBeenCalledWith(
				'1',
				expect.objectContaining({
					role: 'user',
					text: expect.stringContaining('Autocomplete accepted'),
				}),
				null,
			);
		});

		it('calls ingestUserMessage when dto.accepted is false', async () => {
			const dto = {
				input: 'I am writing',
				completion: 'an email',
				accepted: false,
				finalText: 'I am writing',
				acceptedChars: 0,
				conversationId: 'conv-2',
			} as any;

			await service.ingestCompletionRequest('1', dto);

			expect(provider.remember).toHaveBeenCalledWith(
				'1',
				expect.objectContaining({
					role: 'user',
					text: expect.stringContaining('User message'),
				}),
				null,
			);
		});
	});

	describe('ingestAutocompleteAccepted', () => {
		it('stores memory with input, completion, and finalText', async () => {
			const dto = {
				input: 'Hello',
				completion: ' world',
				accepted: true,
				finalText: 'Hello world',
				acceptedChars: 6,
				domain: 'example.com',
				language: 'en',
				requestId: 'req-1',
			} as any;

			await service.ingestAutocompleteAccepted('5', dto, 'conv-abc');

			expect(provider.remember).toHaveBeenCalledWith(
				'5',
				expect.objectContaining({
					role: 'user',
					text: expect.stringContaining('Input: Hello'),
					memory_metadata: expect.objectContaining({
						source: 'autocomplete',
						domain: 'example.com',
						language: 'en',
						request_id: 'req-1',
						conversation_id: 'conv-abc',
					}),
				}),
				null,
			);
		});

		it('uses "none" as conversation_id when not provided', async () => {
			const dto = {
				input: 'text',
				completion: ' more',
				accepted: true,
				finalText: 'text more',
				acceptedChars: 5,
			} as any;

			await service.ingestAutocompleteAccepted('1', dto);

			expect(provider.remember).toHaveBeenCalledWith(
				'1',
				expect.objectContaining({
					memory_metadata: expect.objectContaining({
						conversation_id: 'none',
					}),
				}),
				null,
			);
		});
	});

	describe('ingestUserMessage', () => {
		it('stores user message with correct role and text', async () => {
			await service.ingestUserMessage('3', 'My message text', 'conv-x');

			expect(provider.remember).toHaveBeenCalledWith(
				'3',
				expect.objectContaining({
					role: 'user',
					text: expect.stringContaining('My message text'),
					memory_metadata: expect.objectContaining({
						conversation_id: 'conv-x',
					}),
				}),
				null,
			);
		});

		it('uses "none" as conversation_id when not provided', async () => {
			await service.ingestUserMessage('3', 'Some text');

			expect(provider.remember).toHaveBeenCalledWith(
				'3',
				expect.objectContaining({
					memory_metadata: expect.objectContaining({
						conversation_id: 'none',
					}),
				}),
				null,
			);
		});
	});

	describe('ingestAssistantResponse', () => {
		it('stores assistant response with correct role and metadata', async () => {
			const dto = {
				conversationId: 'conv-1',
				messageId: 'msg-1',
				model: 'gpt-4',
				number: 1,
				platform: 'chatgpt',
				text: 'Hello there',
				timestamp: 1700000000000,
			} as any;

			await service.ingestAssistantResponse('2', dto);

			expect(provider.remember).toHaveBeenCalledWith(
				'2',
				expect.objectContaining({
					role: 'assistant',
					text: expect.stringContaining('Hello there'),
					memory_metadata: expect.objectContaining({
						source: 'conversation',
						conversation_id: 'conv-1',
						message_id: 'msg-1',
						model: 'gpt-4',
						platform: 'chatgpt',
					}),
				}),
				null,
			);
		});

		it('includes occurred_at timestamp', async () => {
			const dto = {
				conversationId: 'conv-1',
				messageId: 'msg-2',
				model: 'gpt-4',
				number: 1,
				platform: 'chatgpt',
				text: 'Response',
				timestamp: 1700000000000,
			} as any;

			await service.ingestAssistantResponse('2', dto);

			expect(provider.remember).toHaveBeenCalledWith(
				'2',
				expect.objectContaining({ occurred_at: expect.any(String) }),
				null,
			);
		});
	});

	describe('error handling', () => {
		it('does not throw when provider.remember rejects', async () => {
			provider.remember.mockRejectedValue(new Error('network error'));

			await expect(
				service.ingestUserMessage('1', 'test', 'conv'),
			).resolves.toBeUndefined();
		});
	});
});
