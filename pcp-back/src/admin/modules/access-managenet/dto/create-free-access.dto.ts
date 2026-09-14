import { IsString } from 'class-validator';

export class CreateFreeAccessDto {
	@IsString()
	userId: string;
}
