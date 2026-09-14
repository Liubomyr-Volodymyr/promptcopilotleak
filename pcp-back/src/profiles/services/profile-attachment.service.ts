import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLModel, PROJECT_KEY } from '../../common/enums';
import { AIService } from '../../ai/services/ai.service';
import { generateFileSummaryPrompt } from '../constants/generate-file-summary-model.prompt';
import {
	extractFirstJsonBlock,
	safeJsonParse,
} from '../utils/llm-response-json-extractor';
import { ProfileAttachment } from '../entities/profile-attachment.entity';
import { CreateProfileAttachmentDto, UpdateProfileAttachmentDto } from '../dto';
import { FileSummary } from '../utils/file-summary.guard';

@Injectable()
export class ProfileAttachmentService {
	constructor(
		@InjectRepository(ProfileAttachment)
		private readonly attachmentRepo: Repository<ProfileAttachment>,
		private readonly aiService: AIService,
	) {}

	async create(dto: CreateProfileAttachmentDto): Promise<ProfileAttachment> {
		const attachment = this.attachmentRepo.create({
			fileName: dto.fileName,
			description: dto.description,
			summary: dto.summary,
			profile: { id: dto.profileId },
		});
		return await this.attachmentRepo.save(attachment);
	}

	async update(
		id: number,
		dto: UpdateProfileAttachmentDto,
	): Promise<ProfileAttachment> {
		await this.attachmentRepo.update(id, dto);
		return this.attachmentRepo.findOneBy({ id });
	}

	async findOne(profileId: string) {
		return this.attachmentRepo.findOne({
			where: { profile: { id: Number(profileId) } },
		});
	}

	async generateSummaryFile(parsed: string): Promise<FileSummary> {
		const llm_result = await this.aiService.aiRequest({
			model: LLModel.GEMINI_FLASH,
			prompt: generateFileSummaryPrompt(parsed),
			project_key: PROJECT_KEY.CUSTOM,
			feature: 'profile/generate-file-summary',
		});
		const rawJson = extractFirstJsonBlock(llm_result);
		return safeJsonParse<FileSummary>(rawJson);
	}
}
