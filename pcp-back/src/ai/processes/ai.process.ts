import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AIService } from '../services/ai.service';

class BaseQueueProcessor {
	constructor(protected aiService: AIService) {}

	protected async processRequest(job: Job): Promise<string> {
		return await this.aiService.aiRequest(job.data);
	}
}

@Processor('claude-requests-queue')
export class ClaudeQueueProcessor extends BaseQueueProcessor {
	constructor(aiService: AIService) {
		super(aiService);
	}

	@Process({ name: 'claude-request-task', concurrency: 15 })
	async processClaudeRequest(job: Job): Promise<string> {
		return this.processRequest(job);
	}
}

@Processor('openai-requests-queue')
export class OpenAIQueueProcessor extends BaseQueueProcessor {
	constructor(aiService: AIService) {
		super(aiService);
	}

	@Process({ name: 'openai-request-task', concurrency: 5 })
	async processOpenAIRequest(job: Job): Promise<string> {
		return this.processRequest(job);
	}
}
