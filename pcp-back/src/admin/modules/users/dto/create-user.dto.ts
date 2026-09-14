import {
	IsEmail,
	IsEnum,
	IsOptional,
	IsString,
	Length,
	IsBoolean,
} from 'class-validator';
import { UserRole } from '../../../../contacts/entities/contact.entity';

export class CreateUserDto {
	@IsOptional()
	@IsString()
	@Length(1, 100)
	firstName?: string;

	@IsOptional()
	@IsString()
	@Length(1, 100)
	lastName?: string;

	@IsEmail()
	email: string;

	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole;

	@IsOptional()
	@IsString()
	@Length(6, 255)
	password?: string;

	@IsOptional()
	@IsBoolean()
	isVerified?: boolean;
}
