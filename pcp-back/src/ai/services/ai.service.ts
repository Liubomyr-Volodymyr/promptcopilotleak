import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AIRequestDto } from '../dto/ai.dto';
import { AiClientFactory } from '../clients/ai-client-factory';
import { LLModel } from '../../common/enums';
import { TokenTrackerService } from '../../token-tracker/services/token-tracker.service';
import { RequestContextStore } from '../../store/request-context.store';
import { ChatResponse } from 'llm-api/dist/src/types';
import { AssistantResponse } from '../dto/assistant.dto';

@Injectable()
export class AIService {
	constructor(
		@InjectQueue('claude-requests-queue')
		private readonly claudeRequestsQueue: Queue,
		@InjectQueue('openai-requests-queue')
		private readonly openaiRequestsQueue: Queue,
		private readonly aiFactory: AiClientFactory,
		private readonly ctxStore: RequestContextStore,
		private readonly tokenTrackerService: TokenTrackerService,
	) {}

	async addJobRequest(dataDto: AIRequestDto): Promise<string> {
		const priority = dataDto.priority || 5;
		const queue = this.getQueueForModel(dataDto.model);
		const jobName = this.getJobNameForModel(dataDto.model);

		const job = await queue.add(jobName, dataDto, {
			priority,
			attempts: 3,
			backoff: { type: 'fixed', delay: 500 },
			timeout: 180 * 1000,
		});

		try {
			console.log(`├───── Added job [AI request]. ID: ${job.id}`);
			return await job.finished();
		} catch (error) {
			console.error('Error in AI request job processing:', error);
			throw new Error(
				'AI request job processing failed: ' + error.message,
			);
		}
	}

	async aiRequest(dto: AIRequestDto): Promise<string> {
		const requestId = this.ctxStore.get('requestId');
		const userId = this.ctxStore.get('userId');

		const {
			model,
			prompt,
			message,
			project_key,
			feature,
			agent_key,
			options,
		} = dto;

		const client = this.aiFactory.create(
			model as LLModel,
			project_key,
			agent_key,
			options,
		);

		let promptText = '';
		if (typeof prompt === 'string') promptText = prompt;
		else if (Array.isArray(message))
			promptText = message.map((m) => m.content).join('\n');
		else if (typeof prompt === 'object')
			promptText = JSON.stringify(prompt);

		const raw: ChatResponse | AssistantResponse =
			await client.textCompletion(prompt, message, {
				maximumResponseTokens: options?.maxTokens,
				stop: options?.stop,
			});

		const completionText =
			typeof raw === 'string'
				? raw
				: (raw?.content ?? JSON.stringify(raw));

		await this.tokenTrackerService.countAndRecordText(
			model,
			raw,
			promptText,
			completionText,
			{
				userId,
				requestId,
				feature,
			},
		);
		return completionText;
	}

	private getQueueForModel(model: string): Queue {
		if (model.startsWith('asst') || model.includes('gpt')) {
			return this.openaiRequestsQueue;
		} else {
			return this.claudeRequestsQueue;
		}
	}

	private getJobNameForModel(model: string): string {
		if (model.startsWith('asst') || model.includes('gpt')) {
			return 'openai-request-task';
		} else {
			return 'claude-request-task';
		}
	}
}
