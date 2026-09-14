import { IsOptional, IsString } from 'class-validator';

export class BusinessProfileDto {
	@IsString()
	domain: string;

	@IsString()
	role: string;

	@IsOptional()
	@IsString()
	relevant_link?: string;

	@IsOptional()
	@IsString()
	company_description: string;

	@IsString()
	primary_goal: string;
}
