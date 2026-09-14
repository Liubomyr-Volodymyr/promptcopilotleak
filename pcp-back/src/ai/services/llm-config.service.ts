import {
	Injectable,
	NotFoundException,
	ConflictException,
	BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmConfigEntity } from '../entities/llm-config.entity';
import { PromptEntity } from '../entities/prompt.entity';
import { CreateLlmConfigDto } from '../../admin/modules/sys-prompts/dto/create-llm-config.dto';
import { UpdateLlmConfigDto } from '../../admin/modules/sys-prompts/dto/update-llm-config.dto';

@Injectable()
export class LlmConfigService {
	constructor(
		@InjectRepository(LlmConfigEntity)
		private readonly repo: Repository<LlmConfigEntity>,
		@InjectRepository(PromptEntity)
		private readonly promptRepo: Repository<PromptEntity>,
	) {}

	async create(dto: CreateLlmConfigDto): Promise<LlmConfigEntity> {
		const prompt = await this.promptRepo.findOne({
			where: { id: dto.systemPromptId },
		});
		if (!prompt) throw new BadRequestException('systemPrompt not found');

		const entity = this.repo.create({
			key: dto.key,
			model: dto.model,
			defaults: dto.defaults ?? null,
			systemPrompt: prompt,
		});

		try {
			return await this.repo.save(entity);
		} catch (err: any) {
			if (err?.code === '23505')
				throw new ConflictException(
					'Config with same key+model already exists',
				);
			throw err;
		}
	}

	async findAll(): Promise<LlmConfigEntity[]> {
		return this.repo.find({ relations: ['systemPrompt'] });
	}

	async findOne(id: string): Promise<LlmConfigEntity> {
		const rec = await this.repo.findOne({
			where: { id },
			relations: ['systemPrompt'],
		});
		if (!rec) throw new NotFoundException('LlmConfig not found');
		return rec;
	}

	async findByKeyModel(key: string): Promise<LlmConfigEntity | null> {
		return this.repo.findOne({
			where: { key },
			relations: ['systemPrompt'],
		});
	}

	async update(
		id: string,
		dto: UpdateLlmConfigDto,
	): Promise<LlmConfigEntity> {
		const rec = await this.repo.findOne({
			where: { id },
			relations: ['systemPrompt'],
		});
		if (!rec) throw new NotFoundException('LlmConfig not found');

		if (dto.systemPromptId) {
			const prompt = await this.promptRepo.findOne({
				where: { id: dto.systemPromptId },
			});
			if (!prompt)
				throw new BadRequestException('systemPrompt not found');
			rec.systemPrompt = prompt;
		}

		if (dto.key !== undefined) rec.key = dto.key;
		if (dto.model !== undefined) rec.model = dto.model;
		if (dto.defaults !== undefined) rec.defaults = dto.defaults;

		try {
			return await this.repo.save(rec);
		} catch (err: any) {
			if (err?.code === '23505')
				throw new ConflictException(
					'Config with same key+model already exists',
				);
			throw err;
		}
	}

	async remove(id: string): Promise<void> {
		const rec = await this.repo.findOne({ where: { id } });
		if (!rec) throw new NotFoundException('LlmConfig not found');
		await this.repo.remove(rec);
	}
}
