import { IsOptional, IsString } from 'class-validator';

export class GlossaryTermDto {
	@IsString()
	term: string;

	@IsOptional()
	@IsString()
	type?: string;

	@IsOptional()
	@IsString()
	definition?: string;

	@IsOptional()
	@IsString()
	ownership?: string;

	@IsOptional()
	@IsString()
	context?: string;
}
