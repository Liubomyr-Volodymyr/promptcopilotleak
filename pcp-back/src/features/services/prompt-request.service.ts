import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcceptedCompletionDto, CreatePromptFeedbackDto } from '../dto';
import { Contact } from '../../contacts/entities/contact.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { SuggestionFeedback } from '../entities/feedback.entity';
import { ClientPrompt } from '../entities/prompt-request.entity';
import { CryptoService } from '../../crypto/services/crypto.service';

export interface Feedback {
	user_id: string;
	original_text: string;
	final_text: string;
	domain: string;
	user_feedback: 'upvote' | 'downvote' | 'none';
	profile: string | null;
}

@Injectable()
export class PromptRequestService {
	constructor(
		@InjectRepository(SuggestionFeedback)
		private readonly feedbackRepo: Repository<SuggestionFeedback>,
		@InjectRepository(Contact)
		private readonly contactRepo: Repository<Contact>,
		@InjectRepository(Profile)
		private readonly profileRepo: Repository<Profile>,
		@InjectRepository(ClientPrompt)
		private readonly repo: Repository<ClientPrompt>,
		private readonly cryptoService: CryptoService,
	) {}

	async createFeedback(
		dto: CreatePromptFeedbackDto,
		user_id: string,
	): Promise<Feedback> {
		const user = await this.contactRepo.findOne({
			where: { id: Number(user_id) },
		});
		if (!user) throw new BadRequestException('User not found');

		let profile: Profile | null = null;
		const pid = (dto as any).profile_id;
		if (pid != null) {
			profile = await this.profileRepo.findOne({
				where: { id: Number(pid) },
			});
			if (!profile) throw new BadRequestException('Profile not found');
		}

		const entity = this.feedbackRepo.create({
			user,
			profile: profile ?? null,
			originalText: dto.original_text,
			finalText: dto.final_text ?? null,
			domain: dto.domain ?? null,
			userFeedback: dto.user_feedback ?? null,
		});
		const saved = await this.feedbackRepo.save(entity);

		return this.toDto(saved);
	}

	private toDto(e: SuggestionFeedback): Feedback {
		const uf = e.userFeedback;
		const user_feedback: Feedback['user_feedback'] =
			uf === 'upvote' || uf === 'downvote' ? uf : 'none';

		return {
			user_id: String(e.user?.id ?? ''),
			original_text: e.originalText ?? '',
			final_text: e.finalText ?? '',
			domain: e.domain ?? '',
			user_feedback,
			profile: e.profile ? String(e.profile.id) : null,
		};
	}

	async create(dto: AcceptedCompletionDto, userId?: number) {
		const encryptedPrompt = this.cryptoService.encrypt(dto.input);

		const entity = this.repo.create({
			prompt: encryptedPrompt,
			userId: userId ?? null,
		});
		const saved = await this.repo.save(entity);

		const prompts = await this.repo.find({
			where: { userId },
			order: { createdAt: 'DESC' },
		});

		if (prompts.length > 5) {
			const toDelete = prompts.slice(5);
			await this.repo.remove(toDelete);
		}

		return {
			...saved,
			prompt: dto.input,
		};
	}

	async findOne(id: string, userId?: number) {
		const entity = await this.repo.findOne({
			where: { id: id, userId },
		});
		if (!entity) return null;
		return {
			...entity,
			prompt: this.cryptoService.decrypt(entity.prompt),
		};
	}

	async remove(id: string, userId?: number) {
		const entity = await this.repo.findOne({
			where: { id: id, userId },
		});
		if (!entity) return null;
		await this.repo.remove(entity);
		return { id };
	}
}
