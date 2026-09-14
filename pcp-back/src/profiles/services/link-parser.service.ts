import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { URL } from 'url';
import * as cheerio from 'cheerio';
import { ApifyClient } from 'apify-client';
import { LinkType } from '../entities/link-context.entity';
import { CONFIG } from '../../config/enums';
import { ConfigService } from '@nestjs/config';

interface ParsedLinkData {
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
}

const APIFY_LINKEDIN_ACTOR_ID =
	'linkedintel-core/linkedin-profile-scraper-no-cookies';
const APIFY_TWITTER_ACTOR_ID = 'apidojo/twitter-user-scraper';

@Injectable()
export class LinkParserService {
	private readonly logger = new Logger(LinkParserService.name);
	private readonly httpClient: AxiosInstance;
	private readonly apifyClient: ApifyClient | null;

	constructor(private readonly config: ConfigService) {
		this.httpClient = axios.create({
			timeout: 15000,
			maxRedirects: 5,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
			},
			maxContentLength: 5 * 1024 * 1024, // 5MB
		});

		this.apifyClient = this.config.get(CONFIG.APIFY_TOKEN)
			? new ApifyClient({ token: this.config.get(CONFIG.APIFY_TOKEN) })
			: null;
		if (!this.apifyClient) {
			this.logger.warn(
				'APIFY_TOKEN is not set — LinkedIn/Twitter parsing will fall back to direct HTML scraping',
			);
		}
	}

	async parseLink(url: string): Promise<ParsedLinkData> {
		try {
			const linkType = this.detectLinkType(url);
			this.logger.log(`Parsing ${linkType} link: ${url}`);

			switch (linkType) {
				case LinkType.LINKEDIN:
					return await this.parseLinkedIn(url);
				case LinkType.TWITTER:
				case LinkType.X:
					return await this.parseTwitter(url);
				case LinkType.CORPORATE:
				case LinkType.AGENCY:
				case LinkType.PERSONAL_BRAND:
					return await this.parseGenericWebsite(url, linkType);
				default:
					return await this.parseGenericWebsite(
						url,
						LinkType.UNKNOWN,
					);
			}
		} catch (error) {
			this.logger.error(`Failed to parse link ${url}: ${error.message}`);
			throw new BadRequestException(
				`Failed to parse link: ${error.message}`,
			);
		}
	}

	private detectLinkType(url: string): LinkType {
		const urlLower = url.toLowerCase();
		if (urlLower.includes('linkedin.com')) {
			return LinkType.LINKEDIN;
		}
		if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
			return LinkType.X;
		}
		return LinkType.UNKNOWN;
	}

	private extractDomain(url: string): string {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname.replace('www.', '');
		} catch {
			return '';
		}
	}

	private async parseGenericWebsite(
		url: string,
		type: LinkType,
	): Promise<ParsedLinkData> {
		const response = await this.httpClient.get(url);
		const $ = cheerio.load(response.data);

		const domain = this.extractDomain(url);

		const title =
			$('meta[property="og:title"]').attr('content') ||
			$('meta[name="twitter:title"]').attr('content') ||
			$('title').text() ||
			$('h1').first().text();

		const description =
			$('meta[property="og:description"]').attr('content') ||
			$('meta[name="twitter:description"]').attr('content') ||
			$('meta[name="description"]').attr('content') ||
			$('p').first().text();

		const imageUrl =
			$('meta[property="og:image"]').attr('content') ||
			$('meta[name="twitter:image"]').attr('content') ||
			$('link[rel="icon"]').attr('href') ||
			$('link[rel="shortcut icon"]').attr('href');

		// Extract main content
		const mainContent = this.extractMainContent($);

		// Extract social links
		const socialLinks = this.extractSocialLinks($, url);

		// Extract contact info
		const contactInfo = this.extractContactInfo($);

		// Extract company name
		const companyName =
			$('meta[property="og:site_name"]').attr('content') ||
			$('.company-name, .brand-name, [class*="company"]')
				.first()
				.text() ||
			domain;

		// Extract author/bio
		const author =
			$('meta[name="author"]').attr('content') ||
			$('.author, [class*="author"]').first().text();

		const bio =
			$('.bio, .about, [class*="bio"], [class*="about"]')
				.first()
				.text()
				.trim() || description;

		// Extract H1, H2 for context
		const headings = {
			h1: $('h1')
				.map((_, el) => $(el).text().trim())
				.get()
				.slice(0, 5),
			h2: $('h2')
				.map((_, el) => $(el).text().trim())
				.get()
				.slice(0, 10),
		};

		return {
			type,
			domain,
			title: title?.trim().substring(0, 500),
			description: description?.trim().substring(0, 2000),
			imageUrl: this.resolveUrl(url, imageUrl),
			content: mainContent.substring(0, 10000),
			metadata: {
				headings,
				language: $('html').attr('lang'),
			},
			author: author?.trim().substring(0, 255),
			companyName: companyName?.trim().substring(0, 255),
			bio: bio?.trim().substring(0, 2000),
			socialLinks,
			contactInfo,
		};
	}

	private async parseLinkedIn(url: string): Promise<ParsedLinkData> {
		if (this.apifyClient) {
			try {
				return await this.parseLinkedInWithApify(url);
			} catch (error) {
				this.logger.warn(
					`Apify LinkedIn scrape failed for ${url}, falling back to direct scraping: ${error.message}`,
				);
			}
		}
		return this.parseLinkedInFallback(url);
	}

	private async parseLinkedInWithApify(url: string): Promise<ParsedLinkData> {
		const run = await this.apifyClient
			.actor(APIFY_LINKEDIN_ACTOR_ID)
			.call({ profileUrls: [url] });

		const { items } = await this.apifyClient
			.dataset(run.defaultDatasetId)
			.listItems();

		const profile = items[0] as Record<string, any> | undefined;
		if (!profile || profile.succeeded === false) {
			throw new Error(
				profile?.error || 'No LinkedIn profile data returned by Apify',
			);
		}

		const fullName =
			profile.fullName ||
			[profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
			undefined;

		return {
			type: LinkType.LINKEDIN,
			domain: this.extractDomain(url),
			title: fullName?.substring(0, 500),
			description: profile.headline?.substring(0, 2000),
			imageUrl:
				profile.profilePic ||
				profile.profilePicHighQuality ||
				profile.photo,
			metadata: {
				profileName: profile.publicIdentifier,
				location: profile.jobLocation || profile.location,
				experience: (profile.experiences || []).slice(0, 5),
				educations: profile.educations,
				skills: profile.skills,
				raw: profile,
			},
			author: fullName,
			companyName: profile.companyName?.substring(0, 255),
			bio: (profile.summary || profile.headline)?.substring(0, 2000),
			socialLinks: {
				linkedin: profile.linkedinUrl || url,
				...(profile.companyLinkedin && {
					companyLinkedin: profile.companyLinkedin,
				}),
			},
			contactInfo: {
				...(profile.email && { email: profile.email }),
				...(profile.mobileNumber && { phone: profile.mobileNumber }),
			},
		};
	}

	private async parseLinkedInFallback(url: string): Promise<ParsedLinkData> {
		try {
			const { $, domain, title, description, imageUrl } =
				await this.getMeta(url);
			const nameMatch = url.match(/linkedin\.com\/in\/([^/]+)/);
			const profileName = nameMatch ? nameMatch[1] : undefined;

			// Extract structured data
			const structuredData = $('script[type="application/ld+json"]')
				.map((_, el) => {
					try {
						return JSON.parse($(el).html() || '{}');
					} catch {
						return null;
					}
				})
				.get()
				.find((data) => data && data['@type']);

			const bio =
				structuredData?.description ||
				description ||
				$('.top-card-layout__headline, .text-body-medium')
					.first()
					.text()
					.trim();

			const location =
				structuredData?.address?.addressLocality ||
				$('.top-card-layout__first-subline').text().trim();

			const experience = $('.experience-item, [class*="experience"]')
				.map((_, el) => ({
					title: $(el).find('.experience-item__title').text().trim(),
					company: $(el)
						.find('.experience-item__company')
						.text()
						.trim(),
				}))
				.get()
				.slice(0, 5);

			return {
				type: LinkType.LINKEDIN,
				domain,
				title: title?.trim().substring(0, 500),
				description: description?.trim().substring(0, 2000),
				imageUrl: this.resolveUrl(url, imageUrl),
				metadata: {
					profileName,
					location,
					experience,
					structuredData,
				},
				author: profileName,
				bio: bio?.trim().substring(0, 2000),
				socialLinks: {
					linkedin: url,
				},
			};
		} catch {
			this.logger.warn(`LinkedIn parsing limited for ${url}`);
			return {
				type: LinkType.LINKEDIN,
				domain: this.extractDomain(url),
				metadata: {
					note: 'LinkedIn may require authentication for full parsing',
				},
			};
		}
	}

	private async parseTwitter(url: string): Promise<ParsedLinkData> {
		if (this.apifyClient) {
			try {
				return await this.parseTwitterWithApify(url);
			} catch (error) {
				this.logger.warn(
					`Apify Twitter/X scrape failed for ${url}, falling back to direct scraping: ${error.message}`,
				);
			}
		}
		return this.parseTwitterFallback(url);
	}

	private async parseTwitterWithApify(url: string): Promise<ParsedLinkData> {
		const run = await this.apifyClient
			.actor(APIFY_TWITTER_ACTOR_ID)
			.call({ startUrls: [url], maxItems: 1 });

		const { items } = await this.apifyClient
			.dataset(run.defaultDatasetId)
			.listItems();

		const profile = items[0] as Record<string, any> | undefined;
		if (!profile) {
			throw new Error('No Twitter/X profile data returned by Apify');
		}

		return {
			type: LinkType.X,
			domain: this.extractDomain(url),
			title: profile.name?.substring(0, 500),
			description: profile.description?.substring(0, 2000),
			imageUrl: profile.profilePicture,
			metadata: {
				username: profile.userName,
				location: profile.location,
				followers: profile.followers,
				following: profile.following,
				isVerified: profile.isVerified || profile.isBlueVerified,
				raw: profile,
			},
			author: profile.userName,
			bio: profile.description?.substring(0, 2000),
			socialLinks: {
				twitter: profile.url || url,
			},
		};
	}

	private async parseTwitterFallback(url: string): Promise<ParsedLinkData> {
		try {
			const { $, domain, title, description, imageUrl } =
				await this.getMeta(url);

			// Extract username from URL
			const usernameMatch = url.match(
				/(?:twitter\.com|x\.com)\/([^/?]+)/,
			);
			const username = usernameMatch ? usernameMatch[1] : undefined;

			// Extract bio
			const bio =
				$('meta[property="og:description"]').attr('content') ||
				$('[data-testid="UserDescription"]').text().trim();

			// Extract location, website from meta
			const location = $('[data-testid="UserLocation"]').text().trim();
			const website = $('[data-testid="UserUrl"]').attr('href');

			return {
				type: LinkType.X,
				domain,
				title: title?.trim().substring(0, 500),
				description: description?.trim().substring(0, 2000),
				imageUrl: this.resolveUrl(url, imageUrl),
				metadata: {
					username,
					location,
					website,
				},
				author: username,
				bio: bio?.trim().substring(0, 2000),
				socialLinks: {
					twitter: url,
					...(website && { website }),
				},
			};
		} catch {
			this.logger.warn(`Twitter/X parsing limited for ${url}`);
			return {
				type: LinkType.X,
				domain: this.extractDomain(url),
				metadata: {
					note: 'Twitter/X may require authentication for full parsing',
				},
			};
		}
	}

	private extractMainContent($: cheerio.Root): string {
		const selectors = [
			'main',
			'article',
			'.content',
			'[role="main"]',
			'.main-content',
		];

		for (const selector of selectors) {
			const content = $(selector).first();
			if (content.length) {
				return content.text().trim();
			}
		}

		return $('body')
			.clone()
			.find('script, style, nav, footer, header')
			.remove()
			.end()
			.text()
			.trim();
	}

	private extractSocialLinks(
		$: cheerio.Root,
		baseUrl: string,
	): Record<string, string> {
		const socialLinks: Record<string, string> = {};

		const socialPatterns = {
			linkedin: /linkedin\.com/i,
			twitter: /(?:twitter\.com|x\.com)/i,
			facebook: /facebook\.com/i,
			instagram: /instagram\.com/i,
			github: /github\.com/i,
			youtube: /youtube\.com/i,
		};

		$('a[href]').each((_, el) => {
			const href = $(el).attr('href');
			if (!href) return;

			const fullUrl = this.resolveUrl(baseUrl, href);

			for (const [platform, pattern] of Object.entries(socialPatterns)) {
				if (pattern.test(fullUrl) && !socialLinks[platform]) {
					socialLinks[platform] = fullUrl;
				}
			}
		});

		return socialLinks;
	}

	private extractContactInfo($: cheerio.Root): Record<string, string> {
		const contactInfo: Record<string, string> = {};

		const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
		const text = $('body').text();
		const emails = text.match(emailRegex);
		if (emails && emails.length > 0) {
			contactInfo.email = emails[0];
		}

		const phoneRegex =
			/[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}/g;
		const phones = text.match(phoneRegex);
		if (phones && phones.length > 0) {
			contactInfo.phone = phones[0];
		}

		$('script[type="application/ld+json"]').each((_, el) => {
			try {
				const data = JSON.parse($(el).html() || '{}');
				if (data.address) {
					if (data.address.streetAddress)
						contactInfo.address = data.address.streetAddress;
					if (data.address.addressLocality)
						contactInfo.city = data.address.addressLocality;
				}
			} catch {}
		});

		return contactInfo;
	}

	private async getMeta(url: string) {
		const response = await this.httpClient.get(url);
		const $ = cheerio.load(response.data);

		const domain = this.extractDomain(url);

		const title =
			$('meta[property="og:title"]').attr('content') || $('title').text();

		const description =
			$('meta[property="og:description"]').attr('content') ||
			$('meta[name="description"]').attr('content');

		const imageUrl = $('meta[property="og:image"]').attr('content');
		return {
			$,
			domain,
			title,
			description,
			imageUrl,
		};
	}

	private resolveUrl(
		baseUrl: string,
		relativeUrl?: string,
	): string | undefined {
		if (!relativeUrl) return undefined;
		try {
			return new URL(relativeUrl, baseUrl).href;
		} catch {
			return relativeUrl;
		}
	}
}
