import { IsString, IsOptional } from 'class-validator';

export class PersonalProfileDto {
	@IsString()
	theme: string;

	@IsString()
	role: string;

	@IsString()
	primary_goal: string;

	@IsOptional()
	@IsString()
	relevant_link?: string;
}
