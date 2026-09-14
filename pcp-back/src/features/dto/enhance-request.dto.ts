import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsNumberString,
	MaxLength,
	IsUrl,
} from 'class-validator';

export class EnhanceRequestDto {
	@IsOptional()
	@IsNumberString()
	profile_id?: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(1000, { message: 'Input must not exceed 1000 characters' })
	input: string;

	@IsUrl()
	@IsOptional()
	domain?: string
}
