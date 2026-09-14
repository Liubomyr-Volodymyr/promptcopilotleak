import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum FileContentType {
	DOCUMENT = 'document',
	PRESENTATION = 'presentation',
	WEBPAGE = 'webpage',
	OTHER = 'other',
}

export class FileSummaryDto {
	@IsEnum(FileContentType)
	content_type: FileContentType;

	@IsString()
	language: string;

	@IsOptional()
	@IsString()
	title?: string;

	@IsString()
	summary: string;
}
