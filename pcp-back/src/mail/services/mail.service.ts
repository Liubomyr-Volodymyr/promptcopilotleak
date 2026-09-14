import {
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerClient } from 'postmark';
import { MailPort } from './mail-services.interface';
import { LandingSupportDto, SendMailDto, SupportListDto } from '../dto';
import { CONFIG } from '../../config/enums';

@Injectable()
export class MailService implements MailPort {
	private readonly client: ServerClient;
	private readonly logger = new Logger(MailService.name);

	constructor(private readonly configService: ConfigService) {
		const token = this.configService.get(CONFIG.POSTMARK_API_KEY);

		if (!token) {
			throw new InternalServerErrorException(
				'POSTMARK_SERVER_TOKEN is not configured',
			);
		}

		this.client = new ServerClient(token);
	}

	async sendMail(dto: SendMailDto): Promise<boolean> {
		try {
			const fromEmail = this.configService.get(CONFIG.INFO_EMAIL);
			const fromName = this.configService.get(CONFIG.EMAIL_FROM_NAME);

			if (!fromEmail || !fromName) {
				throw new InternalServerErrorException(
					'EMAIL_FROM configuration is missing',
				);
			}

			const response = await this.client.sendEmailWithTemplate({
				From: `${fromName} <${fromEmail}>`,
				To: dto.to as string,
				ReplyTo: dto.replyTo as string | undefined,
				TemplateAlias: dto.template,
				TemplateModel: {
					...(dto.context ?? {}),
					subject: dto.subject,
				},
			});

			return response.ErrorCode === 0;
		} catch (error) {
			this.logger.error(
				'Postmark sendMail error',
				error?.message || error,
			);
			throw new InternalServerErrorException('Failed to send email');
		}
	}

	async sendSupportList(
		from: string,
		dto: SupportListDto,
	): Promise<{ message: string }> {
		const supportEmail = this.configService.get(CONFIG.SUPPORT_EMAIL);

		if (!supportEmail) {
			throw new InternalServerErrorException(
				'SUPPORT_EMAIL is not configured',
			);
		}

		const sent = await this.sendMail({
			to: supportEmail.trim(),
			subject: dto.subject,
			replyTo: from,
			template: 'support-message',
			context: {
				from,
				email: from,
				subject: dto.subject,
				message: dto.message,
			},
		});

		if (!sent) {
			throw new InternalServerErrorException(
				'Failed to send support email',
			);
		}

		return { message: 'Support email sent successfully' };
	}

	async sendLandingSupport(
		dto: LandingSupportDto,
	): Promise<{ message: string }> {
		if (!dto.agreeTerms) {
			throw new InternalServerErrorException('Terms must be accepted');
		}

		const supportEmail = this.configService.get(CONFIG.SUPPORT_EMAIL);

		if (!supportEmail) {
			throw new InternalServerErrorException(
				'SUPPORT_EMAIL is not configured',
			);
		}

		const sent = await this.sendMail({
			to: supportEmail.trim(),
			replyTo: `${dto.firstName} ${dto.lastName} <${dto.email}>`,
			template: 'contact-message',
			context: {
				firstName: dto.firstName,
				lastName: dto.lastName,
				email: dto.email,
				message: dto.message,
			},
		});

		if (!sent) {
			throw new InternalServerErrorException(
				'Failed to send contact email',
			);
		}

		return { message: 'Contact email sent successfully' };
	}
}
