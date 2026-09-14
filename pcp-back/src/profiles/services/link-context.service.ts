import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LinkContext } from '../entities/link-context.entity';
import { Profile } from '../entities/profile.entity';
import { LinkContextDto } from '../dto';
import { LinkParserService } from './link-parser.service';
import { MidbrainProvider } from '../../memory/providers/midbrain/midbrain.provider';

@Injectable()
export class LinkContextService {
	constructor(
		@InjectRepository(LinkContext)
		private readonly linkContextRepo: Repository<LinkContext>,
		@InjectRepository(Profile)
		private readonly profileRepo: Repository<Profile>,
		private readonly linkParserService: LinkParserService,
		private readonly midbrainProvider: MidbrainProvider,
	) {}

	async create(url: string, profileId: string): Promise<LinkContextDto> {
		const profile = await this.profileRepo.findOne({
			where: { id: Number(profileId) },
			relations: { contact: true },
		});

		if (!profile) {
			throw new BadRequestException('Profile not found');
		}

		const existing = await this.linkContextRepo.findOne({
			where: { profile: { id: Number(profileId) }, url },
		});

		if (existing) {
			const parsedData = await this.linkParserService.parseLink(url);
			Object.assign(existing, parsedData);
			const updated = await this.linkContextRepo.save(existing);

			this.recordSemanticMemory(profile, updated);

			return this.toDto(updated);
		}

		const parsedData = await this.linkParserService.parseLink(url);

		const entity = this.linkContextRepo.create({
			profile,
			url,
			...parsedData,
		});

		const saved = await this.linkContextRepo.save(entity);

		this.recordSemanticMemory(profile, saved);

		return this.toDto(saved);
	}

	private recordSemanticMemory(profile: Profile, row: LinkContext): void {
		const userId = String(profile.contact?.id);
		if (!userId || userId === 'undefined') return;

		const text = this.formatSemanticText(row);
		if (!text) return;

		this.midbrainProvider
			.uploadLinkContext({
				userId,
				profileId: profile.id,
				url: row.url,
				text,
				metadata: {
					link_type: row.type,
					domain: row.domain,
					title: row.title,
				},
			})
			.catch((error) => {
				console.error(
					`[LinkContextService] Failed to store semantic memory for ${row.url}:`,
					error?.message ?? error,
				);
			});
	}

	private formatSemanticText(row: LinkContext): string {
		const parts: string[] = [];

		if (row.title) parts.push(`Title: ${row.title}`);
		if (row.companyName) parts.push(`Company: ${row.companyName}`);
		if (row.description) parts.push(`Description: ${row.description}`);
		if (row.bio) parts.push(`Bio: ${row.bio}`);
		if (row.content) parts.push(`Content: ${row.content}`);

		return parts.join('\n\n');
	}

	async findAllByProfileId(profileId: string): Promise<LinkContextDto[]> {
		const rows = await this.linkContextRepo.find({
			where: { profile: { id: Number(profileId) } },
			order: { createdAt: 'DESC' },
		});

		return rows.map((r) => this.toDto(r));
	}

	private toDto(row: LinkContext): LinkContextDto {
		return {
			id: row.id,
			url: row.url,
			type: row.type,
			domain: row.domain,
			title: row.title,
			description: row.description,
			imageUrl: row.imageUrl,
			content: row.content,
			metadata: row.metadata,
			author: row.author,
			companyName: row.companyName,
			bio: row.bio,
			socialLinks: row.socialLinks,
			contactInfo: row.contactInfo,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}
}
