import {
	IsBoolean,
	IsEmail,
	IsInt,
	IsISO8601,
	IsObject,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionCheckoutDto {
	@IsOptional()
	@IsEmail()
	email!: string;

	@IsOptional()
	@IsString()
	user_id?: string;

	@IsOptional()
	@IsString()
	slug: string;

	@IsString()
	period: 'month' | 'year';

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	quantity?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	trial_period_days?: number;

	@IsOptional()
	@IsObject()
	metadata?: Record<string, string>;
}

export class UrlDto {
	@IsString()
	url!: string;
}

export class SubscriptionInfoDto {
	@IsString()
	status!: string;

	@IsOptional()
	@IsISO8601()
	current_period_end!: string | null;

	@IsOptional()
	@IsBoolean()
	cancel_at_period_end!: boolean | null;
}
