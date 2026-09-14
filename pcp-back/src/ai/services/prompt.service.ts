import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdatePromptDto } from '../../admin/modules/sys-prompts/dto/update-prompt.dto';
import { PromptEntity } from '../entities/prompt.entity';

@Injectable()
export class PromptService {
	constructor(
		@InjectRepository(PromptEntity)
		private readonly promptRepo: Repository<PromptEntity>,
	) {}
	async update(dto: UpdatePromptDto): Promise<PromptEntity> {
		try {
			const existing = await this.promptRepo.findOne({
				where: { key: dto.key },
			});

			if (existing) {
				return this.promptRepo.save({ ...existing, ...dto });
			}

			return this.promptRepo.save(this.promptRepo.create(dto));
		} catch (err) {
			throw new InternalServerErrorException(err);
		}
	}

	async getPromptByKey(key: string): Promise<string> {
		const prompt = await this.promptRepo.findOne({ where: { key } });
		return prompt.content;
	}
}
