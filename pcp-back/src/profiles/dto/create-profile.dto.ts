import {
	IsString,
	IsEnum,
	IsOptional,
	ValidateNested,
	IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessProfileDto } from './business-profile.dto';
import { PersonalProfileDto } from './personal-profile.dto';
import { SearchProfileDto } from './search-profile.dto';

export enum ProfileType {
	BUSINESS = 'business',
	PERSONAL = 'personal',
	SEARCH = 'search',
}

export class CreateProfileDto {
	@IsEnum(ProfileType)
	type: ProfileType;

	@ValidateNested()
	@Type((o) => {
		if (o.object?.type === ProfileType.BUSINESS) return BusinessProfileDto;
		if (o.object?.type === ProfileType.PERSONAL) return PersonalProfileDto;
		if (o.object?.type === ProfileType.SEARCH) return SearchProfileDto;
		return PersonalProfileDto;
	})
	profile: BusinessProfileDto | PersonalProfileDto | SearchProfileDto;

	@IsOptional()
	@IsDateString()
	created_at?: string;

	@IsOptional()
	@IsString()
	user_id?: string;
}
