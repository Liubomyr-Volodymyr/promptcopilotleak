import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PersonalProfile } from '../../entities/profile-personal.entity';
import { Profile } from '../../entities/profile.entity';
import { PersonalProfileDto } from '../../dto';

@Injectable()
export class PersonalProfileService {
	constructor(
		@InjectRepository(PersonalProfile)
		private readonly ppRepo: Repository<PersonalProfile>,
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

	private toDto(e: PersonalProfile): PersonalProfileDto {
		return {
			theme: e.theme ?? undefined,
			role: e.role ?? undefined,
			primary_goal: e.goal ?? undefined,
		};
	}

	async create(
		profileId: string,
		data: PersonalProfileDto,
	): Promise<PersonalProfileDto> {
		const profile = await this.requireProfile(profileId);

		const entity = this.ppRepo.create({
			profile,
			theme: data.theme ?? null,
			role: data.role ?? null,
			goal: data.primary_goal ?? null,
		});
		const saved = await this.ppRepo.save(entity);
		return this.toDto(saved);
	}

	async update(
		profileId: string,
		data: Partial<PersonalProfileDto>,
	): Promise<PersonalProfileDto> {
		const existing = await this.ppRepo.findOne({
			where: { profile: { id: Number(profileId) } },
		});

		if (!existing) {
			return this.create(profileId, data as PersonalProfileDto);
		}

		existing.theme = data.theme ?? existing.theme ?? null;
		existing.goal = data.primary_goal ?? existing.goal ?? null;

		const saved = await this.ppRepo.save(existing);
		return this.toDto(saved);
	}

	async findAllByProfileId(profileId: string): Promise<PersonalProfileDto[]> {
		const rows = await this.ppRepo.find({
			where: { profile: { id: Number(profileId) } },
			order: { id: 'ASC' },
		});
		return rows.map((e) => this.toDto(e));
	}

	async deleteByProfileId(profileId: string): Promise<void> {
		await this.ppRepo
			.createQueryBuilder()
			.delete()
			.from(PersonalProfile)
			.where('profile_id = :pid', { pid: Number(profileId) })
			.execute();
	}
}
