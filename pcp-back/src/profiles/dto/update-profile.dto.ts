import { PartialType } from '@nestjs/mapped-types';
import { CreateProfileDto } from './create-profile.dto';
import {
	ArrayMaxSize,
	IsArray,
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GlossaryTermDto } from './glossary-term.dto';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(20)
	@ValidateNested({ each: true })
	@Type(() => GlossaryTermDto)
	glossary: GlossaryTermDto[];

	@IsOptional()
	@IsString()
	style_tone: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	copilot_name: string;

	@IsOptional()
	@IsString()
	website_link: string;

	@IsOptional()
	@IsString()
	file_name: string;

	@IsOptional()
	@IsString()
	file_description: string;

	@IsOptional()
	@IsString()
	profile_attachment: string;
}
