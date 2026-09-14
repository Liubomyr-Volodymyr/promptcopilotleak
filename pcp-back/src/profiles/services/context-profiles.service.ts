import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Profile } from '../entities/profile.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import {
	BusinessProfileDto,
	CreateProfileDto,
	PersonalProfileDto,
	ProfileType,
	SearchProfileDto,
	UpdateProfileDto,
} from '../dto';
import { ProfileAttachmentService } from './profile-attachment.service';
import { BusinessProfileService } from './profiles/business-profile.service';
import { PersonalProfileService } from './profiles/personal-profile.service';
import { SearchProfileService } from './profiles/search-profile.service';
import { LinkContextService } from './link-context.service';
import {
	getProfileLabelShort,
	getProfileLabelFull,
} from '../utils/profile-labels.util';

@Injectable()
export class ContextProfilesService {
	constructor(
		@InjectRepository(Profile)
		private readonly profileRepo: Repository<Profile>,
		@InjectRepository(Contact)
		private readonly contactRepo: Repository<Contact>,
		private readonly businessProfileService: BusinessProfileService,
		private readonly personalProfileService: PersonalProfileService,
		private readonly searchProfileService: SearchProfileService,
		private readonly attachmentService: ProfileAttachmentService,
		private readonly linkContextService: LinkContextService,
	) {}

	private async requireContact(user_id: string) {
		const contact = await this.contactRepo.findOne({
			where: { id: Number(user_id) },
		});
		if (!contact) throw new BadRequestException('User not found');
		return contact;
	}

	private async requireProfileOwned(profileId: string, user_id: string) {
		const profile = await this.profileRepo.findOne({
			where: { id: Number(profileId) },
			relations: { contact: true },
		});
		if (!profile) throw new BadRequestException('Profile not found');
		if (String(profile.contact?.id) !== String(user_id)) {
			throw new ForbiddenException('No access to this profile');
		}
		return profile;
	}

	async create(dto: CreateProfileDto, user_id: string) {
		const existing = await this.getCountByUser(user_id);
		if (existing >= 10)
			throw new ForbiddenException('You can have only 10 profiles');

		const contact = await this.requireContact(user_id);

		const row = this.profileRepo.create({
			contact,
			type: dto.type as any,
			styleTone: '',
		});
		const saved = await this.profileRepo.save(row);

		const profileId = String(saved.id);

		if (dto.type === ProfileType.BUSINESS) {
			const businessProfile = dto.profile as BusinessProfileDto;
			const enrichedProfile = { ...businessProfile };

			if (businessProfile.relevant_link) {
				try {
					const linkContext = await this.linkContextService.create(
						businessProfile.relevant_link,
						profileId,
					);

					if (!enrichedProfile.domain && linkContext.domain) {
						enrichedProfile.domain = linkContext.domain;
					}
					if (
						!enrichedProfile.company_description &&
						linkContext.description
					) {
						enrichedProfile.company_description =
							linkContext.description;
					}
					if (
						!enrichedProfile.company_description &&
						linkContext.bio
					) {
						enrichedProfile.company_description = linkContext.bio;
					}
					if (
						!enrichedProfile.company_description &&
						linkContext.content
					) {
						enrichedProfile.company_description =
							linkContext.content.substring(0, 500);
					}
				} catch (error) {
					console.error(
						`Failed to parse link ${businessProfile.relevant_link}:`,
						error.message,
					);
				}
			}

			await this.businessProfileService.create(
				profileId,
				enrichedProfile,
			);
		} else if (dto.type === ProfileType.SEARCH) {
			const searchProfile = dto.profile as unknown as SearchProfileDto;
			if (searchProfile.relevant_link) {
				try {
					await this.linkContextService.create(
						searchProfile.relevant_link,
						profileId,
					);
				} catch (error) {
					console.error(
						`Failed to parse link ${searchProfile.relevant_link}:`,
						error.message,
					);
				}
			}

			await this.searchProfileService.create(profileId, searchProfile);
		} else {
			const personalProfile = dto.profile as PersonalProfileDto;
			if (personalProfile.relevant_link) {
				try {
					await this.linkContextService.create(
						personalProfile.relevant_link,
						profileId,
					);
				} catch (error) {
					console.error(
						`Failed to parse link ${personalProfile.relevant_link}:`,
						error.message,
					);
				}
			}

			await this.personalProfileService.create(
				profileId,
				personalProfile,
			);
		}

		return { data: saved };
	}

	private async getCountByUser(user_id: string): Promise<number> {
		return await this.profileRepo.count({
			where: { contact: { id: Number(user_id) } },
		});
	}

	async findAll(user_id: string) {
		const profiles = await this.profileRepo.find({
			where: { contact: { id: Number(user_id) } },
			order: { id: 'ASC' },
		});

		return profiles.map((profile) => ({
			...profile,
			label: getProfileLabelShort(profile.type),
		}));
	}

	async getListByUserId(user_id: string) {
		const rows = await this.profileRepo.find({
			where: { contact: { id: Number(user_id) } },
			select: { id: true, copilotName: true, type: true },
			order: { id: 'ASC' },
		});

		return rows.map((i) => ({
			id: i.id,
			name: i.copilotName ?? null,
			label: getProfileLabelShort(i.type),
		}));
	}

	async findOne(profileId: string, user_id: string) {
		const profile = await this.requireProfileOwned(profileId, user_id);

		const linkContexts =
			await this.linkContextService.findAllByProfileId(profileId);

		let base:
			| PersonalProfileDto
			| BusinessProfileDto
			| SearchProfileDto
			| null;

		if (profile.type === ProfileType.BUSINESS) {
			const rows =
				await this.businessProfileService.findAllByProfileId(profileId);
			base = rows?.[0] ?? null;
		} else if (profile.type === 'search') {
			const rows =
				await this.searchProfileService.findAllByProfileId(profileId);
			base = rows?.[0] ?? null;
		} else {
			const rows =
				await this.personalProfileService.findAllByProfileId(profileId);
			base = rows?.[0] ?? null;
		}
		const attachment = await this.attachmentService.findOne(profileId);

		const transformed: any = {
			id: profile.id,
			user_id: profile.contact?.id,
			type: profile.type,
			label: getProfileLabelFull(profile.type),
			copilot_name: profile.copilotName ?? null,
			created_at: profile.createdAt,
			updated_at: profile.updatedAt,
			profile: base,
			profile_glossary: [],
			style_tone: profile.styleTone ?? null,
			profile_attachment: attachment?.fileName ?? null,
			link_contexts: linkContexts ?? [],
		};

		return transformed;
	}

	async update(id: string, dto: UpdateProfileDto, user_id: string) {
		const profile = await this.requireProfileOwned(id, user_id);

		const patch: Partial<Profile> = {};
		if (dto.type) patch.type = dto.type;
		if (dto.copilot_name) patch.copilotName = dto.copilot_name;
		if (dto.style_tone) patch.styleTone = dto.style_tone;

		if (Object.keys(patch).length) {
			await this.profileRepo.update({ id: Number(id) }, patch);
		}

		if (dto.profile) {
			const profileType = dto.type ?? profile.type;
			if (profileType === ProfileType.BUSINESS) {
				const businessProfile = dto.profile as BusinessProfileDto;
				await this.businessProfileService.update(id, businessProfile);

				if (businessProfile.relevant_link) {
					try {
						await this.linkContextService.create(
							businessProfile.relevant_link,
							id,
						);
					} catch (error) {
						console.error(
							`Failed to parse link ${businessProfile.relevant_link}:`,
							error.message,
						);
					}
				}
			} else if (profileType === 'search') {
				const searchProfile =
					dto.profile as unknown as SearchProfileDto;
				await this.searchProfileService.update(id, searchProfile);

				if (searchProfile.relevant_link) {
					try {
						await this.linkContextService.create(
							searchProfile.relevant_link,
							id,
						);
					} catch (error) {
						console.error(
							`Failed to parse link ${searchProfile.relevant_link}:`,
							error.message,
						);
					}
				}
			} else {
				await this.personalProfileService.update(
					id,
					dto.profile as PersonalProfileDto,
				);
			}
		}

		if (dto.website_link) {
			try {
				await this.linkContextService.create(dto.website_link, id);
			} catch (error) {
				console.error(
					`Failed to parse website_link ${dto.website_link}:`,
					error.message,
				);
			}
		}

		if (dto.file_description) {
			await this.attachmentService.update(Number(id), {
				description: dto.file_description,
			});
		}
		return this.findOne(id, user_id);
	}

	async remove(id: string, user_id: string) {
		await this.requireProfileOwned(id, user_id);

		const results = await Promise.allSettled([
			this.businessProfileService.deleteByProfileId(id),
			this.personalProfileService.deleteByProfileId(id),
			this.searchProfileService.deleteByProfileId(id),
		]);

		const errors = results.filter(
			(r) => r.status === 'rejected',
		) as PromiseRejectedResult[];
		if (errors.length) {
			console.error(
				'[X] child delete errors:',
				errors.map((e) => e.reason?.response?.data ?? e.reason),
			);
			throw new InternalServerErrorException(
				'Failed to delete all child records',
			);
		}

		await this.profileRepo.delete({ id: Number(id) });
	}
}
