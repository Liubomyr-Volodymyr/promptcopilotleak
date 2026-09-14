import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

import { PromptEntity } from '../ai/entities/prompt.entity';
import { LlmConfigEntity } from '../ai/entities/llm-config.entity';

export class LlmConfigSeeder implements Seeder {
	public async run(dataSource: DataSource): Promise<void> {
		const configRepo = dataSource.getRepository(LlmConfigEntity);
		const promptRepo = dataSource.getRepository(PromptEntity);

		const DEFAULT_CONFIGS: Array<{
			key: string;
			model: string;
			defaults?: {
				temperature?: number;
				maxTokens?: number;
				topP?: number;
				stop?: string[] | null;
				stream?: boolean;
			};
		}> = [
			{
				key: 'autocomplete',
				model: 'groq-oss',
				defaults: {
					temperature: 0.2,
					topP: 1,
				},
			},
		];

		for (const cfg of DEFAULT_CONFIGS) {
			const existingConfig = await configRepo.findOne({
				where: { key: cfg.key, model: cfg.model },
			});
			if (existingConfig) continue;

			let prompt = await promptRepo.findOne({
				where: { key: cfg.key },
			});

			if (!prompt) {
				prompt = promptRepo.create({
					key: cfg.key,
					content: `System prompt for ${cfg.key}`,
				});
				await promptRepo.save(prompt);
			}

			const entity = configRepo.create({
				key: cfg.key,
				model: cfg.model,
				defaults: cfg.defaults ?? null,
				systemPrompt: prompt,
			});

			await configRepo.save(entity);
		}
	}
}
