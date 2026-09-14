import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ACResponseDto {
	@IsString()
	@IsNotEmpty()
	input: string;

	@IsOptional()
	@IsString()
	@IsArray()
	suggestions?: string[];

	@IsOptional()
	@IsString()
	suggestion?: string;
}
