import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessProfile } from '../../entities/profile-business.entity';
import { Profile } from '../../entities/profile.entity';
import { BusinessProfileDto } from '../../dto';

@Injectable()
export class BusinessProfileService {
	constructor(
		@InjectRepository(BusinessProfile)
		private readonly bpRepo: Repository<BusinessProfile>,
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

	private toDto(e: BusinessProfile): BusinessProfileDto {
		return {
			domain: e.domain ?? undefined,
			role: e.role ?? undefined,
			primary_goal: e.primaryGoal ?? undefined,
			company_description: e.companyDescription ?? undefined,
			relevant_link: e.relevantLink ?? undefined,
		};
	}

	async create(
		profileId: string,
		data: BusinessProfileDto,
	): Promise<BusinessProfileDto> {
		const profile = await this.requireProfile(profileId);

		const entity = this.bpRepo.create({
			profile,
			domain: data.domain ?? null,
			role: data.role ?? null,
			primaryGoal: data?.primary_goal ?? null,
			companyDescription: data.company_description ?? null,
			relevantLink: data.relevant_link ?? null,
		});
		const saved = await this.bpRepo.save(entity);
		return this.toDto(saved);
	}

	async update(
		profileId: string,
		data: Partial<BusinessProfileDto>,
	): Promise<BusinessProfileDto> {
		const existing = await this.bpRepo.findOne({
			where: { profile: { id: Number(profileId) } },
		});

		if (!existing) {
			return this.create(profileId, data as BusinessProfileDto);
		}

		existing.domain = data.domain ?? existing.domain ?? null;
		existing.role = data.role ?? existing.role ?? null;
		existing.primaryGoal =
			data.primary_goal ?? existing.primaryGoal ?? null;
		existing.companyDescription = data.company_description ?? null;
		existing.relevantLink = data.relevant_link ?? null;

		const saved = await this.bpRepo.save(existing);
		return this.toDto(saved);
	}

	async findAllByProfileId(profileId: string): Promise<BusinessProfileDto[]> {
		const rows = await this.bpRepo.find({
			where: { profile: { id: Number(profileId) } },
			order: { id: 'ASC' },
		});
		return rows.map((e) => this.toDto(e));
	}

	async deleteByProfileId(profileId: string): Promise<void> {
		await this.bpRepo
			.createQueryBuilder()
			.delete()
			.from(BusinessProfile)
			.where('profile_id = :pid', { pid: Number(profileId) })
			.execute();
	}
}
