import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUrl,
	IsNumberString,
	MaxLength,
	MinLength,
} from 'class-validator';
import { IsMeaningful } from '../utils/validation/decorators/is-meaningful.decorator';

export class AutocompleteRequestDto {
	@IsOptional()
	@IsNumberString()
	profile_id?: string;

	@IsOptional()
	@IsString()
	conversationId?: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	@MaxLength(1000, { message: 'Input must not exceed 1000 characters' })
	@IsMeaningful({
		message: 'Input seems like gibberish, please provide meaningful text',
	})
	input: string;

	@IsUrl({ require_tld: false })
	@IsOptional()
	domain?: string;

	@IsOptional()
	debug?: string;
}
