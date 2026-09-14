import { Type } from 'class-transformer';
import {
	IsOptional,
	IsString,
	IsInt,
	Min,
	Max,
	IsISO8601,
	IsIn,
	IsNumber,
} from 'class-validator';

export class QueryTokenUsageDto {
	@IsOptional()
	@IsString()
	userId?: string;

	@IsOptional()
	@IsString()
	model?: string;

	@IsOptional()
	@IsString()
	feature?: string;

	@IsOptional()
	@IsISO8601()
	dateFrom?: string;

	@IsOptional()
	@IsISO8601()
	dateTo?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(1000)
	limit?: number = 50;

	@IsOptional()
	@IsString()
	@IsIn([
		'createdAt',
		'totalTokens',
		'promptTokens',
		'completionTokens',
		'model',
	])
	sortBy?: string = 'createdAt';

	@IsOptional()
	@IsString()
	@IsIn(['ASC', 'DESC', 'asc', 'desc'])
	order?: 'ASC' | 'DESC' = 'DESC';

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	promptPrice?: number;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	completionPrice?: number;

	@IsOptional()
	@IsString()
	@IsIn(['none', 'user', 'model', 'day'])
	groupBy?: 'none' | 'user' | 'model' | 'day' = 'none';
}
