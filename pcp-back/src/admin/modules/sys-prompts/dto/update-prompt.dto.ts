import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum Feature {
	AUTOCOMPLETE = 'autocomplete',
	SUMMARY = 'summary',
	TONE_ANALYZER = 'tone_analyzer',
	CONTEXT_PROFILE = 'context_profile',
}

export class UpdatePromptDto {
	@ApiProperty({
		enum: Feature,
		example: Feature.AUTOCOMPLETE,
	})
	@Transform(({ value }) => value as Feature)
	@IsEnum(Feature)
	key: Feature;

	@IsOptional()
	@IsString()
	content?: string;
}
