import { SendMailDto, LandingSupportDto, SupportListDto } from '../dto';

export interface MailPort {
	sendMail(dto: SendMailDto): Promise<boolean>;
	sendSupportList(
		from: string,
		dto: SupportListDto,
	): Promise<{ message: string }>;
	sendLandingSupport(dto: LandingSupportDto): Promise<{ message: string }>;
}
