import { Module } from '@nestjs/common';
import { AIService } from './services/ai.service';
import { BullModule } from '@nestjs/bull';
import {
	ClaudeQueueProcessor,
	OpenAIQueueProcessor,
} from './processes/ai.process';
import { AssistantService } from './services/assistant.service';
import { AiClientFactory } from './clients/ai-client-factory';
import { TokenTrackerModule } from '../token-tracker/token-tracker.module';
import { LlmConfigService } from './services/llm-config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmConfigEntity } from './entities/llm-config.entity';
import { PromptEntity } from './entities/prompt.entity';
import { PromptService } from './services/prompt.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([LlmConfigEntity, PromptEntity]),
		TokenTrackerModule,
		BullModule.registerQueue(
			{ name: 'claude-requests-queue' },
			{ name: 'openai-requests-queue' },
		),
	],
	providers: [
		AIService,
		AssistantService,
		AiClientFactory,
		LlmConfigService,
		PromptService,
		ClaudeQueueProcessor,
		OpenAIQueueProcessor,
	],
	exports: [AIService, AssistantService, LlmConfigService, PromptService],
})
export class AIModule {}
