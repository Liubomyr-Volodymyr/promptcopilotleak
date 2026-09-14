import { EnhanceService } from './enhance.service';
import { LLModel, LLMFeatures, PROJECT_KEY } from '../../common/enums';
import {
	ENHANCE_PROMPT_WITH_PROFILE,
	ENHANCE_PROMPT_WITHOUT_PROFILE,
} from '../constants/enhance-prompts';

const aiService = { aiRequest: jest.fn() };
const contextService = { findOne: jest.fn() };
const attachmentService = { findOne: jest.fn() };
const memoryAgentService = {
	ensureAgent: jest.fn(),
	ensureProfileAgentExists: jest.fn(),
	getAgent: jest.fn(),
};
const memoryRetrievalService = {
	retrieveProfile: jest.fn(),
	retrieve: jest.fn(),
	retrieveSemantic: jest.fn(),
	retrieveProcedural: jest.fn(),
	retrieveProfileAgentContext: jest.fn(),
};

const DEFAULT_AGENT = { agentSK: 'agent-key' };

describe('EnhanceService', () => {
	let service: EnhanceService;

	beforeEach(() => {
		jest.resetAllMocks();

		memoryAgentService.ensureAgent.mockResolvedValue(undefined);
		memoryAgentService.ensureProfileAgentExists.mockResolvedValue(undefined);
		memoryAgentService.getAgent.mockResolvedValue(DEFAULT_AGENT);
		memoryRetrievalService.retrieveProfile.mockResolvedValue({
			description: 'user profile',
		});
		memoryRetrievalService.retrieveProfileAgentContext.mockResolvedValue(null);
		memoryRetrievalService.retrieve.mockResolvedValue([]);
		memoryRetrievalService.retrieveSemantic.mockResolvedValue({
			items: [],
		});
		memoryRetrievalService.retrieveProcedural.mockResolvedValue({
			items: [],
		});
		aiService.aiRequest.mockResolvedValue('enhanced text');

		service = new EnhanceService(
			aiService as any,
			contextService as any,
			attachmentService as any,
			memoryAgentService as any,
			memoryRetrievalService as any,
		);
	});

	describe('enhanceContext', () => {
		it('returns "enhanced" stub', async () => {
			const result = await service.enhanceContext('1', 'some text');
			expect(result).toBe('enhanced');
		});
	});

	describe('getEnhancement', () => {
		it('returns input and suggestion from LLM response', async () => {
			const result = await service.getEnhancement(
				{ input: 'my draft' } as any,
				'1',
			);

			expect(result).toEqual({
				input: 'my draft',
				suggestion: 'enhanced text',
			});
		});

		it('uses ENHANCE_PROMPT_WITHOUT_PROFILE when no profile_id provided', async () => {
			await service.getEnhancement({ input: 'draft text' } as any, '1');

			expect(aiService.aiRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					prompt: ENHANCE_PROMPT_WITHOUT_PROFILE,
				}),
			);
		});

		it('uses ENHANCE_PROMPT_WITH_PROFILE when profile is found', async () => {
			contextService.findOne.mockResolvedValue({
				id: 5,
				profile: {},
				style_tone: null,
				link_contexts: [],
			});
			attachmentService.findOne.mockResolvedValue(null);

			await service.getEnhancement(
				{ input: 'draft text', profile_id: '5' } as any,
				'1',
			);

			expect(aiService.aiRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					prompt: ENHANCE_PROMPT_WITH_PROFILE,
				}),
			);
		});

		it('falls back to ENHANCE_PROMPT_WITHOUT_PROFILE when profile not found', async () => {
			contextService.findOne.mockResolvedValue(null);

			await service.getEnhancement(
				{ input: 'draft text', profile_id: '99' } as any,
				'1',
			);

			expect(aiService.aiRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					prompt: ENHANCE_PROMPT_WITHOUT_PROFILE,
				}),
			);
		});

		it('calls AI with correct feature and project_key', async () => {
			await service.getEnhancement({ input: 'draft text' } as any, '42');

			expect(aiService.aiRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					feature: LLMFeatures.ENHANCE,
					project_key: PROJECT_KEY.CONTEXT,
					agent_key: 'agent-key',
				}),
			);
		});

		it('uses specified llm_model when provided', async () => {
			await service.getEnhancement(
				{ input: 'draft' } as any,
				'1',
				LLModel.GEMINI_FLASH,
			);

			expect(aiService.aiRequest).toHaveBeenCalledWith(
				expect.objectContaining({ model: LLModel.GEMINI_FLASH }),
			);
		});

		it('defaults to GEMINI_FLASH when no llm_model provided', async () => {
			await service.getEnhancement({ input: 'draft' } as any, '1');

			expect(aiService.aiRequest).toHaveBeenCalledWith(
				expect.objectContaining({ model: LLModel.GEMINI_FLASH }),
			);
		});

		it('includes link_contexts in additionalResource when profile has links', async () => {
			contextService.findOne.mockResolvedValue({
				id: 5,
				profile: {},
				style_tone: null,
				link_contexts: [
					{
						type: 'website',
						url: 'https://example.com',
						title: 'Example',
						description: 'A site',
						bio: null,
						content: null,
						companyName: null,
					},
				],
			});
			attachmentService.findOne.mockResolvedValue(null);

			await service.getEnhancement(
				{ input: 'draft', profile_id: '5' } as any,
				'1',
			);

			expect(aiService.aiRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining('Example'),
				}),
			);
		});

		it('ensures agent and retrieves all memory types', async () => {
			await service.getEnhancement({ input: 'draft' } as any, '7');

			expect(memoryAgentService.ensureAgent).toHaveBeenCalledWith(7);
			expect(memoryRetrievalService.retrieveProfile).toHaveBeenCalledWith(
				'7',
			);
			expect(memoryRetrievalService.retrieve).toHaveBeenCalledWith(
				expect.objectContaining({ userId: '7' }),
			);
			expect(
				memoryRetrievalService.retrieveSemantic,
			).toHaveBeenCalledWith(expect.objectContaining({ userId: '7' }));
			expect(
				memoryRetrievalService.retrieveProcedural,
			).toHaveBeenCalledWith(expect.objectContaining({ userId: '7' }));
		});

		it('loads profile attachment when profile is found', async () => {
			contextService.findOne.mockResolvedValue({
				id: 5,
				profile: {},
				style_tone: null,
				link_contexts: [],
			});
			attachmentService.findOne.mockResolvedValue({
				id: 'att-1',
				profileId: 5,
				content: 'file data',
			});

			await service.getEnhancement(
				{ input: 'draft', profile_id: '5' } as any,
				'1',
			);

			expect(attachmentService.findOne).toHaveBeenCalledWith(5);
		});
	});
});
