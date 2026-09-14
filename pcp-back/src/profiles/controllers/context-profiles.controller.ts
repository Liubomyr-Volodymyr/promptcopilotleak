import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Req,
	UseGuards,
	UseInterceptors,
	UploadedFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ContextProfilesService } from '../services/context-profiles.service';
import { CreateProfileDto, UpdateProfileDto } from '../dto';
import { EmailThrottlerGuard, JwtAuthGuard } from '../../auth/guards';
import {
	ApiCreateProfile,
	ApiDeleteProfile,
	ApiFindAllProfiles,
	ApiFindOneProfile,
	ApiGetProfilesList,
	ApiUpdateProfile,
} from '../docs';
import { ApiUploadProfileFile } from '../docs/api-upload-profile-file.decorator';
import { ProfileImportService } from '../../file/services/profile-import.service';
import { ProfileAttachmentService } from '../services/profile-attachment.service';
import { ProfileUploadInterceptor } from '../utils/profile-upload.interceptor';
import { StyleToneService } from '../services/style-tone.service';
import { FileSummary } from '../utils/file-summary.guard';
import { MidbrainProvider } from '../../memory/providers/midbrain/midbrain.provider';

@ApiTags('Profiles')
@Controller('profiles')
@ApiBearerAuth('access_token')
@UseGuards(JwtAuthGuard)
export class ContextProfilesController {
	constructor(
		private readonly profilesService: ContextProfilesService,
		private readonly styleToneService: StyleToneService,
		private readonly fileContext: ProfileAttachmentService,
		private readonly fileService: ProfileImportService,
		private readonly midbrainProvider: MidbrainProvider,
	) {}

	@Throttle({ default: { limit: 2, ttl: 60000 } })
	@Post(':id/style-tone/preview')
	@UseGuards(JwtAuthGuard, EmailThrottlerGuard)
	@ApiOperation({ summary: 'Style tone preview from profile' })
	async previewStyleTone(@Param('id') id: string, @Req() req: Request) {
		const userId = req.user.userId;
		const profile = await this.profilesService.findOne(id, userId);
		return await this.styleToneService.generatePreviewTone(profile);
	}

	@Post('upload')
	@UseInterceptors(ProfileUploadInterceptor('file'))
	@ApiUploadProfileFile()
	async upload(
		@UploadedFile() file: Express.Multer.File,
		@Body() body: { profileId: number; description: string },
		@Req() req: Request,
	) {
		const userId = req.user.userId;
		const parsed = await this.fileService.detectAndExtract(file);
		const fileSummary: FileSummary =
			await this.fileContext.generateSummaryFile(parsed.rawText);
		const createFile = await this.fileContext.create({
			profileId: body.profileId,
			fileName: file.originalname,
			description: body.description,
			summary: fileSummary.summary,
		});

		this.midbrainProvider.uploadDocument({
			userId,
			text: parsed.rawText,
			fileName: file.originalname,
			profileId: body.profileId,
		});

		return {
			ok: true,
			detectedType: parsed.detectedType,
			profile: parsed.profile,
			createFile,
			rawTextPreview: parsed.rawText.slice(0, 500),
		};
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiCreateProfile()
	async create(@Body() dto: CreateProfileDto, @Req() req: Request) {
		console.log(dto);
		return await this.profilesService.create(dto, req.user.userId);
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiFindAllProfiles()
	findAll(@Req() req: Request) {
		return this.profilesService.findAll(req.user.userId);
	}

	@Get('list')
	@UseGuards(JwtAuthGuard)
	@ApiGetProfilesList()
	getListByUserId(@Req() req: Request) {
		return this.profilesService.getListByUserId(req.user.userId);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard)
	@ApiFindOneProfile()
	findOne(@Param('id') id: string, @Req() req: Request) {
		return this.profilesService.findOne(id, req.user.userId);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiUpdateProfile()
	update(
		@Param('id') profileId: string,
		@Body() dto: UpdateProfileDto,
		@Req() req: Request,
	) {
		return this.profilesService.update(profileId, dto, req.user.userId);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiDeleteProfile()
	remove(@Param('id') id: string, @Req() req: Request) {
		return this.profilesService.remove(id, req.user.userId);
	}
}
