import { Type } from 'class-transformer';
import {
	IsOptional,
	IsString,
	IsEnum,
	IsBoolean,
	IsInt,
	Min,
	Max,
	IsISO8601,
} from 'class-validator';
import { UserRole } from '../../../../contacts/entities/contact.entity';

export class QueryUsersDto {
	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	email?: string;

	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole;

	@IsOptional()
	@IsBoolean()
	@Type(() => Boolean)
	isVerified?: boolean;

	@IsOptional()
	@IsISO8601()
	createdFrom?: string;

	@IsOptional()
	@IsISO8601()
	createdTo?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 25;

	@IsOptional()
	@IsBoolean()
	@Type(() => Boolean)
	withDeleted?: boolean = false;
}
