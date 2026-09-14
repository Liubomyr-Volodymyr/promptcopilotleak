import { Request, Response } from 'express';
import {
	Controller,
	Get,
	Body,
	Patch,
	Param,
	Req,
	UseGuards,
	Post,
	UseInterceptors,
	UploadedFile,
	Res,
	Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContactService } from '../services';
import { UpdateContactDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards';
import {
	ApiFindContactByEmail,
	ApiGetAvatar,
	ApiUpdateUserProfile,
	ApiUploadAvatar,
} from '../docs';
import { ApiDeleteContact } from '../docs/api-delete-contact.decorator';

@ApiTags('Users')
@ApiBearerAuth('access_token')
@Controller('users')
export class ContactController {
	constructor(private readonly usersService: ContactService) {}

	@Patch('profile')
	@UseGuards(JwtAuthGuard)
	@ApiUpdateUserProfile()
	async updateContactProfile(
		@Body() updateDto: UpdateContactDto,
		@Req() req: Request,
	) {
		const userId = req.user.userId;
		return await this.usersService.updateContact(userId, updateDto);
	}

	@Get('avatar')
	@UseGuards(JwtAuthGuard)
	@ApiGetAvatar()
	async getAvatar(@Req() req: Request, @Res() res: Response): Promise<void> {
		try {
			const { stream, contentType, contentLength, etag } =
				await this.usersService.getAvatarImageStream(req.user.userId);

			res.setHeader('Content-Type', contentType);
			if (contentLength)
				res.setHeader('Content-Length', String(contentLength));
			if (etag) res.setHeader('ETag', etag);

			stream.on('error', () =>
				res.status(404).end('Failed to fetch avatar'),
			);
			stream.pipe(res);
		} catch (err: any) {
			console.error('getAvatar error:', err?.message || err);
			res.status(404).send('Failed to fetch avatar');
		}
	}

	@Get(':email')
	@UseGuards(JwtAuthGuard)
	@ApiFindContactByEmail()
	findOne(@Param('email') email: string) {
		return this.usersService.findOneByEmail(email);
	}

	@Post('avatar')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(
		FileInterceptor('file', {
			limits: {
				fileSize: 5 * 1024 * 1024, // 5MB
			},
		}),
	)
	@ApiUploadAvatar()
	async uploadAvatar(
		@UploadedFile() file: Express.Multer.File,
		@Req() req: Request,
	) {
		const userId = req.user.userId;
		const avatarId = await this.usersService.uploadAvatar(userId, file);
		return { avatarId };
	}

	@Delete()
	@UseGuards(JwtAuthGuard)
	@ApiDeleteContact()
	deleteContact(@Req() req: Request): Promise<string> {
		return this.usersService.deleteContact(req.user.userId);
	}
}
