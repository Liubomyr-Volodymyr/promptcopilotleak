import {
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUrl,
} from 'class-validator';

export class CreatePromptFeedbackDto {
	@IsString()
	@IsNotEmpty()
	original_text: string;

	@IsString()
	@IsNotEmpty()
	final_text: string;

	@IsNotEmpty()
	@IsUrl()
	domain: string;

	@IsEnum(['upvote', 'downvote'])
	@IsOptional()
	user_feedback?: 'upvote' | 'downvote' | undefined;

	@IsNumber()
	@IsOptional()
	profile?: number | null;
}
