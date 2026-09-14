import { IsNumber, IsString } from 'class-validator';

export class CreateProfileAttachmentDto {
	fileName: string;

	@IsString()
	description?: string;

	@IsString()
	summary?: string;

	@IsNumber()
	profileId: number;
}
