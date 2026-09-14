import { IsString, IsUrl, IsOptional } from 'class-validator';
import { LinkType } from '../entities/link-context.entity';

export class CreateLinkContextDto {
	@IsUrl()
	url: string;

	@IsOptional()
	@IsString()
	profileId?: string;
}

export class LinkContextDto {
	id: number;
	url: string;
	type: LinkType;
	domain?: string;
	title?: string;
	description?: string;
	imageUrl?: string;
	content?: string;
	metadata?: Record<string, any>;
	author?: string;
	companyName?: string;
	bio?: string;
	socialLinks?: Record<string, string>;
	contactInfo?: Record<string, string>;
	createdAt: Date;
	updatedAt: Date;
}
