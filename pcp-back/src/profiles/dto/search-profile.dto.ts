import { IsString, IsOptional } from 'class-validator';

export class SearchProfileDto {
	@IsString()
	primary_work_area: string;

	@IsOptional()
	@IsString()
	format?: string; // 1-3 answers separated by '/'

	@IsOptional()
	@IsString()
	sources?: string; // 1-3 answers separated by '/'

	@IsOptional()
	@IsString()
	relevant_link?: string;
}
