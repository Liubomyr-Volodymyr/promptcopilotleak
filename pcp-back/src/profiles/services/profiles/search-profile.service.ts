import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchProfile } from '../../entities/profile-search.entity';
import { Profile } from '../../entities/profile.entity';
import { SearchProfileDto } from '../../dto';

@Injectable()
export class SearchProfileService {
	constructor(
		@InjectRepository(SearchProfile)
		private readonly spRepo: Repository<SearchProfile>,
		@InjectRepository(Profile)
		private readonly profileRepo: Repository<Profile>,
	) {}

	private async requireProfile(profileId: string): Promise<Profile> {
		const profile = await this.profileRepo.findOne({
			where: { id: Number(profileId) },
		});
		if (!profile) throw new BadRequestException('Profile not found');
		return profile;
	}

	private toDto(e: SearchProfile): SearchProfileDto {
		return {
			primary_work_area: e.primaryWorkArea ?? undefined,
			format: e.format ?? undefined,
			sources: e.sources ?? undefined,
			relevant_link: e.relevantLink ?? undefined,
		};
	}

	async create(
		profileId: string,
		data: SearchProfileDto,
	): Promise<SearchProfileDto> {
		const profile = await this.requireProfile(profileId);

		const entity = this.spRepo.create({
			profile,
			primaryWorkArea: data.primary_work_area ?? null,
			format: data.format ?? null,
			sources: data.sources ?? null,
			relevantLink: data.relevant_link ?? null,
		});
		const saved = await this.spRepo.save(entity);
		return this.toDto(saved);
	}

	async update(
		profileId: string,
		data: Partial<SearchProfileDto>,
	): Promise<SearchProfileDto> {
		const existing = await this.spRepo.findOne({
			where: { profile: { id: Number(profileId) } },
		});

		if (!existing) {
			return this.create(profileId, data as SearchProfileDto);
		}

		existing.primaryWorkArea =
			data.primary_work_area ?? existing.primaryWorkArea ?? null;
		existing.format = data.format ?? existing.format ?? null;
		existing.sources = data.sources ?? existing.sources ?? null;
		existing.relevantLink =
			data.relevant_link ?? existing.relevantLink ?? null;

		const saved = await this.spRepo.save(existing);
		return this.toDto(saved);
	}

	async findAllByProfileId(profileId: string): Promise<SearchProfileDto[]> {
		const rows = await this.spRepo.find({
			where: { profile: { id: Number(profileId) } },
			order: { id: 'ASC' },
		});
		return rows.map((e) => this.toDto(e));
	}

	async deleteByProfileId(profileId: string): Promise<void> {
		await this.spRepo
			.createQueryBuilder()
			.delete()
			.from(SearchProfile)
			.where('profile_id = :pid', { pid: Number(profileId) })
			.execute();
	}
}
