import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileAttachmentDto {
	@IsOptional()
	@IsString()
	fileName?: string;

	@IsOptional()
	@IsString()
	description?: string;
}
