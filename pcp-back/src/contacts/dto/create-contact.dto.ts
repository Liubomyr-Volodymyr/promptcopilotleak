import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateContactDto {
	@IsNotEmpty()
	@IsString()
	first_name: string;

	@IsNotEmpty()
	@IsString()
	last_name: string;

	@IsNotEmpty()
	@IsEmail()
	email: string;

	@IsNotEmpty()
	@IsString()
	password?: string;
}
