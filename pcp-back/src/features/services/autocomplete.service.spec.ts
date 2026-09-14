import { AutocompleteService } from './autocomplete.service';
import { LLModel, LLMFeatures, PROJECT_KEY } from '../../common/enums';
import { calcOverlapFuzzy } from '../utils/fuzzy-overlap.util';
import { parseAiSuggestions } from '../utils/ai-suggestions-parser.util';

jest.mock('../utils/fuzzy-overlap.util', () => ({
	calcOverlapFuzzy: jest.fn(),
}));

jest.mock('../utils/ai-suggestions-parser.util', () => ({
	parseAiSuggestions: jest.fn(),
}));

const mockedCalcOverlapFuzzy = calcOverlapFuzzy as jest.Mock;
const mockedParseAiSuggestions = parseAiSuggestions as jest.Mock;

describe('AutocompleteService (minimal)', () => {
	let service: AutocompleteService;

	const aiService = {
		aiRequest: jest.fn(),
	};

	const profileService = {
		findOne: jest.fn(),
	};

	const llmConfigService = {
		findByKeyModel: jest.fn(),
	};

	const memoryAgentService = {
		ensureAgent: jest.fn(),
		getAgent: jest.fn(),
	};

	const memoryRetrievalService = {
		retrieveProfile: jest.fn(),
		retrieve: jest.fn(),
		retrieveSemantic: jest.fn(),
		retrieveProcedural: jest.fn(),
		retrieveProfileAgentContext: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();

		service = new AutocompleteService(
			aiService as any,
			profileService as any,
			llmConfigService as any,
			memoryAgentService as any,
			memoryRetrievalService as any,
		);

		llmConfigService.findByKeyModel.mockResolvedValue({
			systemPrompt: { content: 'system prompt' },
			defaults: {},
		});

		memoryAgentService.getAgent.mockResolvedValue({
			agentSK: 'agent-key',
		});

		memoryRetrievalService.retrieveProfile.mockResolvedValue({
			description: 'profile',
		});

		memoryRetrievalService.retrieve.mockResolvedValue([]);
		memoryRetrievalService.retrieveSemantic.mockResolvedValue({ items: [] });
		memoryRetrievalService.retrieveProcedural.mockResolvedValue({});
		memoryRetrievalService.retrieveProfileAgentContext.mockResolvedValue(null);
	});

	it('should return response and call LLM', async () => {
		aiService.aiRequest.mockResolvedValue('raw llm output');

		mockedParseAiSuggestions.mockReturnValue(['some suggestion']);

		mockedCalcOverlapFuzzy.mockReturnValue(0);

		const result = await service.getComplete(
			{ input: 'how to' } as any,
			'1',
			LLModel.GEMINI_FLASH_LITE,
		);

		expect(aiService.aiRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				feature: LLMFeatures.AUTOCOMPLETE,
				project_key: PROJECT_KEY.CUSTOM,
			}),
		);

		expect(result).toHaveProperty('input');
		expect(result).toHaveProperty('suggestion');
		expect(result).toHaveProperty('suggestions');
	});
});
