import {
	IsBoolean,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DefaultsDto {
	@IsOptional()
	temperature?: number;

	@IsOptional()
	maxTokens?: number;

	@IsOptional()
	topP?: number;

	@IsOptional()
	stop?: string[] | null;

	@IsOptional()
	stream?: boolean;
}

export class CreateLlmConfigDto {
	@IsString()
	key: string;

	@IsString()
	model: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => DefaultsDto)
	defaults?: DefaultsDto;

	@IsUUID()
	systemPromptId: string;

	@IsOptional()
	@IsObject()
	meta?: Record<string, any>;

	@IsOptional()
	@IsBoolean()
	enabled?: boolean;
}
