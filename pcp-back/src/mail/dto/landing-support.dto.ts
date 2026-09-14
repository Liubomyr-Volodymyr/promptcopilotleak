import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LandingSupportDto {
	@IsString()
	@IsNotEmpty()
	firstName: string;

	@IsString()
	@IsNotEmpty()
	lastName: string;

	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	message: string;

	@IsBoolean()
	@IsNotEmpty()
	agreeTerms: boolean;
}
