import {
	Body,
	Controller,
	Post,
	Req,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiSupportMail } from '../docs/api-support-list.decorator';
import { LandingSupportDto, SupportListDto } from '../dto';
import { ApiLandingSupportMail } from '../docs/landing-support-list.decorator';
import { MailService } from '../services/mail.service';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
	constructor(private readonly mailService: MailService) {}

	@Post('support')
	@ApiSupportMail()
	@ApiBearerAuth('access_token')
	@UseGuards(JwtAuthGuard)
	async sendSupport(@Body() dto: SupportListDto, @Req() req: Request) {
		const email = req.user.email;
		return this.mailService.sendSupportList(email, {
			subject: dto.subject,
			message: dto.message,
		});
	}

	@Post('landing-support')
	@HttpCode(HttpStatus.OK)
	@ApiLandingSupportMail()
	async sendLandingSupport(@Body() dto: LandingSupportDto) {
		return this.mailService.sendLandingSupport(dto);
	}
}
