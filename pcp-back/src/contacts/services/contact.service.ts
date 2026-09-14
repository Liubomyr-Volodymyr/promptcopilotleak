import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { CreateContactDto, UpdateContactDto, UpdatePasswordDto } from '../dto';
import { Contact } from '../entities/contact.entity';
import {
	ContactProvider,
	ContactProviderType,
} from '../entities/contact-provider.entity';
import { MinioService } from '../../minio/services/minio.service';
import { Readable } from 'stream';
import { HASH_SALT } from '../../common/constants';
import axios from 'axios';
import { fromBuffer } from 'file-type';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContactService {
	constructor(
		private readonly dataSource: DataSource,
		@InjectRepository(Contact)
		private readonly contactRepo: Repository<Contact>,
		@InjectRepository(ContactProvider)
		private readonly providerRepo: Repository<ContactProvider>,
		private readonly minio: MinioService,
	) {}

	async create(dto: CreateContactDto) {
		if (!dto.email) throw new BadRequestException('Email is required');

		const existing = await this.contactRepo.findOne({
			where: { email: dto.email },
		});
		if (existing) throw new BadRequestException('User already exists');

		return this.dataSource.transaction(async (em) => {
			const contactRepository = em.getRepository(Contact);
			const contact = contactRepository.create({
				firstName: dto.first_name,
				lastName: dto.last_name,
				email: dto.email,
				password: dto.password ?? null,
				isVerified: false,
			});
			await contactRepository.save(contact);

			return {
				id: contact.id,
				first_name: contact.firstName,
				last_name: contact.lastName,
				email: contact.email,
				isVerified: false,
				created_at: contact.createdAt,
				updated_at: contact.updatedAt,
			};
		});
	}

	async createGoogleUser(
		dto: CreateContactDto & { avatarUrl?: string | null },
	) {
		const contact = await this.dataSource.transaction(async (em) => {
			const contactRepository = em.getRepository(Contact);
			const providerRepository = em.getRepository(ContactProvider);

			const created = contactRepository.create({
				firstName: dto.first_name ?? null,
				lastName: dto.last_name ?? null,
				email: dto.email,
				password: null,
				isVerified: true,
			});
			await contactRepository.save(created);

			const provider = providerRepository.create({
				contact: created,
				provider: ContactProviderType.GOOGLE,
				providerId: String(created.id),
			});

			await providerRepository.save(provider);

			return created;
		});

		const withProviders = await this.contactRepo.findOne({
			where: { id: contact.id },
			relations: { providers: true },
		});

		const resultContact = withProviders ?? contact;

		if (dto.avatarUrl) {
			try {
				await this.uploadAvatarFromUrl(resultContact.id, dto.avatarUrl);
			} catch (err: any) {
				console.warn(
					'Failed to upload avatar from URL for google user',
					err?.message ?? err,
				);
			}
			const refreshed = await this.contactRepo.findOne({
				where: { id: resultContact.id },
			});
			return refreshed ?? resultContact;
		}

		return resultContact;
	}

	async hasProvider(contactId: number, provider: string): Promise<boolean> {
		const id = Number(contactId);
		const count = await this.providerRepo.count({
			where: {
				contact: { id },
				provider: provider as ContactProviderType,
			},
		});
		return count > 0;
	}

	async findOneByEmailForAuth(email: string): Promise<Contact | null> {
		return this.contactRepo
			.createQueryBuilder('c')
			.leftJoinAndSelect('c.providers', 'p')
			.where('LOWER(c.email) = :email', { email })
			.addSelect('c.password')
			.getOne();
	}

	async findOneByEmail(email: string): Promise<Contact | null> {
		const norm = email.trim().toLowerCase();
		return this.contactRepo.findOne({
			where: { email: norm },
			relations: { providers: true },
		});
	}

	async findContactById(id: string | number) {
		const contact = await this.contactRepo.findOne({
			where: { id: Number(id) },
		});
		return contact ?? null;
	}

	async getProfile(user_id: string) {
		const user = await this.findContactById(user_id);
		if (!user) throw new NotFoundException('User not found');
		return {
			first_name: user.firstName,
			last_name: user.lastName,
			email: user.email,
		};
	}

	async createProviderRecord(
		contactId: string | number,
		provider: ContactProviderType,
	) {
		const contact = await this.findContactById(contactId);
		if (!contact) throw new BadRequestException('Contact not found');

		const rec = this.providerRepo.create({
			contact,
			provider,
			providerId: String(contact.id),
		});
		return await this.providerRepo.save(rec);
	}

	async updatePassword(id: string, dto: UpdatePasswordDto) {
		const user = await this.contactRepo
			.createQueryBuilder('c')
			.addSelect('c.password')
			.where('c.id = :id', { id: Number(id) })
			.getOne();

		if (!user) throw new BadRequestException('User not found');
		const isMatch = user.password
			? await bcrypt.compare(dto.old_password, user.password)
			: false;
		if (!isMatch)
			throw new UnauthorizedException('Old password is incorrect');

		const hashed = await bcrypt.hash(dto.new_password, HASH_SALT);
		await this.patchUserPassword(id, hashed);
		return { message: 'Password updated successfully' };
	}

	async resetPassword(id: string, pass: string) {
		await this.findContactById(id);
		const hashed = await bcrypt.hash(pass, HASH_SALT);
		await this.patchUserPassword(id, hashed);
		return { message: 'Password reset successfully' };
	}

	private async patchUserPassword(userId: string | number, password: string) {
		await this.contactRepo.update({ id: Number(userId) }, { password });
	}

	async updateContact(id: string, dto: UpdateContactDto) {
		const patch: Partial<Contact> = {};
		if (dto.first_name !== undefined) patch.firstName = dto.first_name;
		if (dto.last_name !== undefined) patch.lastName = dto.last_name;

		if (Object.keys(patch).length) {
			await this.contactRepo.update({ id: Number(id) }, patch);
		}
		return { success: true };
	}

	async getAvatarImageStream(userId: string): Promise<{
		stream: Readable;
		contentType: string;
		contentLength?: number;
		etag?: string;
	}> {
		const contact = await this.findContactById(userId);
		const objectKey: string | undefined = contact?.avatar;
		if (!objectKey) throw new NotFoundException('Avatar not found');

		try {
			const [stat, stream] = await Promise.all([
				this.minio.statObject(objectKey),
				this.minio.getObject(objectKey),
			]);

			const md = (stat as any).metaData ?? {};
			const contentType =
				md['content-type'] ||
				md['Content-Type'] ||
				'application/octet-stream';

			return {
				stream,
				contentType,
				contentLength: (stat as any).size,
				etag: (stat as any).etag,
			};
		} catch {
			throw new NotFoundException('Avatar image not found');
		}
	}

	async uploadAvatar(
		userId: string | number,
		file: Express.Multer.File,
	): Promise<string> {
		if (!file) throw new BadRequestException('File is required');

		const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
		if (!allowed.includes(file.mimetype)) {
			throw new BadRequestException(
				'Only JPG, PNG, WEBP, or AVIF files are allowed',
			);
		}

		const contact = await this.findContactById(userId);
		const oldKey: string | undefined = contact?.avatar;

		const ext =
			file.mimetype === 'image/png'
				? 'png'
				: file.mimetype === 'image/webp'
					? 'webp'
					: file.mimetype === 'image/avif'
						? 'avif'
						: 'jpg';

		const objectKey = `avatars/${userId}/avatar-${Date.now()}.${ext}`;

		if (oldKey) {
			try {
				await this.minio.removeObject(oldKey);
			} catch (rmErr: any) {
				console.error(
					`Failed to remove old avatar "${oldKey}": ${rmErr?.message || rmErr}`,
				);
			}
		}

		await this.minio.putObject(objectKey, file.buffer, {
			'Content-Type': file.mimetype,
			'X-Amz-Meta-File-Name': file.originalname,
		});

		await this.contactRepo.update(
			{ id: Number(userId) },
			{ avatar: objectKey },
		);

		return objectKey;
	}

	async uploadAvatarFromUrl(
		userId: string | number,
		url: string,
	): Promise<string> {
		const MAX_BYTES = 5 * 1024 * 1024;
		const res = await axios
			.get<ArrayBuffer>(url, {
				responseType: 'arraybuffer',
				timeout: 10_000,
				headers: {
					'User-Agent': 'Mozilla/5.0 (compatible)',
					Accept: 'image/*',
				},
				maxContentLength: MAX_BYTES + 1,
			})
			.catch((err) => {
				console.error(err);
				throw new BadRequestException(
					'Failed to download avatar image',
				);
			});

		const buffer = Buffer.from(res.data);
		if (buffer.length === 0) throw new BadRequestException('Empty image');
		if (buffer.length > MAX_BYTES)
			throw new BadRequestException('Image too large');

		const type = await fromBuffer(buffer);
		if (!type || !type.mime.startsWith('image/'))
			throw new BadRequestException('Invalid image type');

		const ext = type.ext ?? 'jpg';
		const originalname = `${uuidv4()}.${ext}`;

		const multerLikeFile: Express.Multer.File = {
			fieldname: 'file',
			originalname,
			encoding: '7bit',
			mimetype: type.mime,
			size: buffer.length,
			buffer,
			destination: '',
			filename: originalname,
			path: '',
			stream: undefined as any,
		};

		return await this.uploadAvatar(userId, multerLikeFile);
	}

	async deleteContact(id: string): Promise<string> {
		await this.contactRepo.delete(id);
		return 'Deleted successfully';
	}
}
