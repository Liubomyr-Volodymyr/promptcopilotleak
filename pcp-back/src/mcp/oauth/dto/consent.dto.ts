import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class ConsentDto {
	@IsUUID()
	requestId: string;

	@IsBoolean()
	approve: boolean;
}

export class ConsentRequestParamsDto {
	@IsNotEmpty()
	requestId: string;
}
