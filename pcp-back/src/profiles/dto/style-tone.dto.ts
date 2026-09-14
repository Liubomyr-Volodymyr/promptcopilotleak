import { IsNotEmpty, IsString } from 'class-validator';

export class StyleToneDto {
	@IsString()
	@IsNotEmpty()
	tone: string;
}
