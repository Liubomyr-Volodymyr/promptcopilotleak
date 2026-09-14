import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class AdminLoginDto {
	@IsEmail()
	email: string;

	@IsStrongPassword()
	@IsString()
	password: string;
}
