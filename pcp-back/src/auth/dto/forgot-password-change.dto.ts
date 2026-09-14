import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
	@ApiProperty({
		description: 'Temporary token returned after confirming code',
	})
	@IsString()
	token: string;

	@ApiProperty({ description: 'New password', minLength: 8 })
	@IsString()
	@MinLength(8)
	newPassword: string;
}
