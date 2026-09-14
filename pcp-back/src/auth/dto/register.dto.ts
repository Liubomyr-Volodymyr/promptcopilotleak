import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
	@IsString()
	first_name: string;

	@IsString()
	last_name: string;

	@IsEmail()
	@IsNotEmpty()
	email: string;

	@MinLength(6)
	password: string;
}
