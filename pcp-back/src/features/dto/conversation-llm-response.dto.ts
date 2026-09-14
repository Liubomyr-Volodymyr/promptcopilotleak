import { ApiProperty } from '@nestjs/swagger';
import {
	IsString,
	IsNumber,
	IsNumberString,
	IsOptional,
} from 'class-validator';

export class ConversationLLMResponseDto {
	@ApiProperty({
		example: '6a208563-2ce4-83eb-b831-64b71889345e',
	})
	@IsString()
	@IsOptional()
	conversationId?: string;

	@ApiProperty({ required: false, example: '12' })
	@IsOptional()
	@IsNumberString()
	profile_id?: string;

	@ApiProperty({
		example: '2513577-56dd-4419-9e68-fae252663c67',
	})
	@IsString()
	messageId: string;

	@ApiProperty({ example: 'gpt-5-5' })
	@IsOptional()
	model?: string;

	@ApiProperty({
		example: 3,
	})
	@IsNumber()
	number: number;

	@ApiProperty({
		example: 'chatgpt',
	})
	@IsString()
	platform: string;

	@ApiProperty({
		example:
			'Привіт! Все добре, дякую. Як у тебе справи? Чим можу допомогти сьогодні?',
	})
	@IsString()
	text: string;

	@ApiProperty({
		example: 1788516345560,
		description: 'Unix timestamp in milliseconds',
	})
	@IsNumber()
	timestamp: number;
}
