import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Put,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ApiUpdatePrompt } from './docs/api-update-prompt.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { UpdateLlmConfigDto } from './dto/update-llm-config.dto';
import { LlmConfigService } from '../../../ai/services/llm-config.service';
import { ApiUpdateLlmConfig } from './docs/api-update-llm-config';
import { PromptEntity } from '../../../ai/entities/prompt.entity';
import { PromptService } from '../../../ai/services/prompt.service';
import { ApiGetLlmConfig } from './docs/api-get-llm-config.decorator';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminRole } from '../../entities/admin.entity';

@ApiTags('Admin LLM Config')
@ApiBearerAuth('access_token')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.Admin, AdminRole.SuperAdmin)
@Controller('llm')
export class SysPromptController {
	constructor(
		private readonly llmConfigService: LlmConfigService,
		private readonly promptService: PromptService,
	) {}

	@Get(':key')
	@ApiGetLlmConfig()
	async getLlmConfig(@Param('key') key: string) {
		return await this.llmConfigService.findByKeyModel(key);
	}

	@Put('update')
	@ApiUpdateLlmConfig()
	async updateConfig(@Body() payload: UpdateLlmConfigDto) {
		const config = await this.llmConfigService.findByKeyModel(payload.key);
		return this.llmConfigService.update(config.id, payload);
	}

	@Put('prompt/file')
	@HttpCode(200)
	@ApiUpdatePrompt()
	@UseInterceptors(FileInterceptor('file'))
	updatePrompt(
		@UploadedFile() file: Express.Multer.File,
		@Body() dto: UpdatePromptDto,
	): Promise<PromptEntity> {
		if (file && file.buffer) {
			const content = file.buffer.toString('utf8');
			return this.promptService.update({ ...dto, content });
		}
		return this.promptService.update(dto);
	}
}
