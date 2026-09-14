import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumberString, IsOptional, IsString } from 'class-validator';

export class GetContextDto {
	@ApiProperty({
		example: '## Role\nYou are an expert email marketer...',
	})
	@IsString()
	prompt_body: string;

	@ApiProperty({
		example: [
			'target-audience',
			'pain-points',
			'product-or-service',
			'key-benefits',
			'social-proof',
			'your-name',
			'your-title',
			'your-company',
		],
		type: [String],
	})
	@IsArray()
	@IsString({ each: true })
	variables: string[];

	@ApiProperty({ required: false, example: '12' })
	@IsOptional()
	@IsNumberString()
	profileId?: string;
}
