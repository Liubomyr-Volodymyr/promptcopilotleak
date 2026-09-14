import {
	Body,
	Controller,
	Get,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiCreatePromptFeedback, ApiEnhanceDocs } from '../docs';
import { EmailThrottlerGuard, JwtAuthGuard } from '../../auth/guards';
import { EnhanceService } from '../services/enhance.service';
import {
	AllowFreeTrials,
	FreeReqPeriod,
} from '../../free-trials/decorators/allow-free-trials.decorator';
import { SubscriptionGuard } from '../../billing/guards/subscription.guard';
import { ENHANCE_QUANTITY } from '../constants/free-trials';
import { ENHANCE_LIMITS } from '../constants/rate-limit';
import { UseLLM } from '../../common/decorators/llm.decorator';
import { LLModel } from '../../common/enums';
import { LlmModel } from '../../common/decorators/llm-param.decorator';
import { CreatePromptFeedbackDto, EnhanceRequestDto } from '../dto';
import { PromptRequestService } from '../services/prompt-request.service';

@ApiTags('Enhancement')
@ApiBearerAuth('access_token')
@Controller()
export class EnhanceController {
	constructor(
		private readonly enhanceService: EnhanceService,
		private readonly feedbackService: PromptRequestService,
	) {}

	@Throttle(ENHANCE_LIMITS)
	@Get('enhance')
	@UseLLM(LLModel.OPENROUTER_GPT_4O)
	// @AllowFreeTrials('enhance', ENHANCE_QUANTITY, FreeReqPeriod.WEEK)
	@UseGuards(JwtAuthGuard, /* SubscriptionGuard, */ EmailThrottlerGuard)
	@ApiEnhanceDocs()
	async enhance(
		@Query() query: EnhanceRequestDto,
		@Req() req: Request,
		@LlmModel() llmModel?: LLModel,
	) {
		return this.enhanceService.getEnhancement(
			query,
			req.user.userId,
			llmModel,
		);
	}

	@Post('prompt-feedback')
	@ApiCreatePromptFeedback()
	@UseGuards(JwtAuthGuard)
	create(@Body() dto: CreatePromptFeedbackDto, @Req() req: Request) {
		return this.feedbackService.createFeedback(dto, req.user.userId);
	}
}
