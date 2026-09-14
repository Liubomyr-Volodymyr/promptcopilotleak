import {
	IsBoolean,
	IsInt,
	IsNumberString,
	IsOptional,
	IsString,
	Max,
	Min,
	MinLength,
	MaxLength,
} from 'class-validator';

export class AcceptedCompletionDto {
	@IsOptional()
	@IsNumberString()
	profile_id?: string;

	@IsString()
	@MinLength(1)
	@MaxLength(2048)
	input: string;

	@IsString()
	completion: string;

	@IsBoolean()
	accepted: boolean;

	@IsInt()
	@Max(5000)
	acceptedChars: number;

	@IsString()
	@MinLength(1)
	@MaxLength(5000)
	finalText: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	domain?: string;

	@IsOptional()
	@IsString()
	@MaxLength(12)
	language?: string;

	@IsOptional()
	@IsString()
	requestId?: string;

	@IsOptional()
	@IsString()
	conversationId: string
}
