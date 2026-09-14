import { AIService } from '../../ai/services/ai.service';
import { UpdateProfileDto } from '../dto';
import { LLModel, PROJECT_KEY } from '../../common/enums';
import { generatePreviewTonePrompt } from '../constants/generate-preview-tone.prompt';
import { StyleToneDto } from '../dto/style-tone.dto';
import {
	extractFirstJsonBlock,
	safeJsonParse,
} from '../utils/llm-response-json-extractor';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class StyleToneService {
	constructor(private readonly aiService: AIService) {}
	async generatePreviewTone(
		profile: UpdateProfileDto,
	): Promise<StyleToneDto> {
		if (!profile || Object.keys(profile).length === 0) {
			throw new BadRequestException('Profile data is required');
		}

		const llm_result = await this.aiService.aiRequest({
			model: LLModel.GEMINI_FLASH,
			prompt: generatePreviewTonePrompt(profile),
			project_key: PROJECT_KEY.CUSTOM,
			feature: 'profile/generate-style-tone',
		});

		try {
			const text =
				typeof llm_result === 'string'
					? llm_result
					: (llm_result ?? JSON.stringify(llm_result));

			const rawJson = extractFirstJsonBlock(text);
			const parsed = safeJsonParse<any>(rawJson);

			return {
				tone: parsed[0]?.tone || 'Classic',
			};
		} catch (err) {
			console.error(err);
			return {
				tone: 'Classic',
			};
		}
	}
}
