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
import { AutocompleteService } from '../services/autocomplete.service';
import {
	AutocompleteRequestDto,
	ACResponseDto,
	AcceptedCompletionDto,
} from '../dto';
import { ApiAutocompleteDocs, ApiPromptAcceptedCompletionDocs } from '../docs';
import { EmailThrottlerGuard, JwtAuthGuard } from '../../auth/guards';
import { UseLLM } from '../../common/decorators/llm.decorator';
import { UseLocalInterceptors } from '../../common/decorators/use-local-interceptors.decorator';
import { LLModel } from '../../common/enums';
import { ACDebugInterceptor } from '../interceptors/ac-debug.interceptor';
import { LlmModel } from '../../common/decorators/llm-param.decorator';
import {
	AllowFreeTrials,
	FreeReqPeriod,
} from '../../free-trials/decorators/allow-free-trials.decorator';
import { AUTOCOMPLETE_QUANTITY } from '../constants/free-trials';
import { SubscriptionGuard } from '../../billing/guards/subscription.guard';
import { AUTOCOMPLETE_LIMITS } from '../constants/rate-limit';
import { MemoryStoreService } from '../services/memory-store.service';
import { ConversationLLMResponseDto } from '../dto/conversation-llm-response.dto';

import { AnyJwtAuthGuard } from '../../auth/guards/any-jwt.guard';

@ApiTags('Autocompletion')
@ApiBearerAuth('access_token')
@Controller()
export class AutocompleteController {
	constructor(
		private readonly completeService: AutocompleteService,
		private readonly memoryStore: MemoryStoreService,
	) {}

	@Throttle(AUTOCOMPLETE_LIMITS)
	@Get('autocomplete')
	@UseLLM(LLModel.OPENROUTER_GPT_4O_MINI)
	// @AllowFreeTrials('autocomplete', AUTOCOMPLETE_QUANTITY, FreeReqPeriod.WEEK)
	@UseGuards(AnyJwtAuthGuard, /* SubscriptionGuard, */ EmailThrottlerGuard)
	@UseLocalInterceptors(ACDebugInterceptor)
	@ApiAutocompleteDocs()
	async autocomplete(
		@Query() query: AutocompleteRequestDto,
		@Req() req: Request,
		@LlmModel() llm?: LLModel,
	): Promise<ACResponseDto> {
		return this.completeService.getComplete(query, String(req.user.userId), llm);
	}

	@Post('prompt/request')
	@UseGuards(JwtAuthGuard)
	@ApiPromptAcceptedCompletionDocs()
	async storeAcceptedCompletion(
		@Body() dto: AcceptedCompletionDto,
		@Req() req: Request,
	) {
		await this.memoryStore.ingestCompletionRequest(req.user.userId, dto);

		return { ok: true };
	}

	@Post('llm/response')
	@UseGuards(JwtAuthGuard)
	async storeLLMResponse(
		@Body() dto: ConversationLLMResponseDto,
		@Req() req: Request,
	) {
		return this.memoryStore.ingestAssistantResponse(req.user.userId, dto);
	}
}
