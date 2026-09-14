import {
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import {
	ContactVerification,
	VerificationPurpose,
} from '../entities/contact-verification.entity';
import { Contact } from '../entities/contact.entity';
import { MAX_ATTEMPTS } from '../../common/constants';

type CreateVerificationDto = {
	contact_email: string;
	purpose: VerificationPurpose;
	code: string;
	expires_at: string | Date; // ISO or Date
};

@Injectable()
export class ContactVerificationService {
	constructor(
		@InjectRepository(ContactVerification)
		private readonly cvRepo: Repository<ContactVerification>,
		@InjectRepository(Contact)
		private readonly contactRepo: Repository<Contact>,
	) {}

	async findLatestActiveByPurpose(
		email: string,
		purpose: VerificationPurpose,
	) {
		try {
			const now = new Date();
			const row = await this.cvRepo.findOne({
				where: {
					contactEmail: email,
					purpose,
					expiresAt: MoreThan(now),
				},
				order: { createdAt: 'DESC' },
			});
			if (!row) {
				throw new UnauthorizedException(
					'Verification code not found or expired',
				);
			}
			return row;
		} catch (err: any) {
			console.error('[find-latest-active] failed:', err?.message || err);
			if (err instanceof UnauthorizedException) throw err;
			throw new InternalServerErrorException(
				'Failed to fetch verification code',
			);
		}
	}

	async createVerificationRecord(data: CreateVerificationDto) {
		try {
			const contactEmail = data.contact_email;
			const purpose = data.purpose;
			const expiresAt =
				data.expires_at instanceof Date
					? data.expires_at
					: new Date(data.expires_at);

			await this.cvRepo.delete({ contactEmail, purpose });

			const rec = this.cvRepo.create({
				contactEmail,
				purpose,
				code: data.code.trim(),
				attempts: 0,
				expiresAt,
			});
			return await this.cvRepo.save(rec);
		} catch (err: any) {
			console.error(
				'createVerificationRecord error:',
				err?.message || err,
			);
			throw new InternalServerErrorException(
				'Failed to create verification code',
			);
		}
	}

	async findVerificationCode(params: {
		email: string;
		code: string;
		purpose: VerificationPurpose;
	}) {
		const record = await this.cvRepo.findOne({
			where: {
				contactEmail: params.email,
				purpose: params.purpose,
				code: params.code.trim(),
				expiresAt: MoreThan(new Date()),
			},
		});

		if (!record) {
			throw new UnauthorizedException('Invalid or expired code');
		}

		if (record.attempts >= MAX_ATTEMPTS) {
			throw new UnauthorizedException('Too many attempts');
		}

		return record;
	}

	async incrementAttempts(id: number) {
		await this.cvRepo
			.createQueryBuilder()
			.update(ContactVerification)
			.set({ attempts: () => `"attempts" + 1` })
			.where({ id })
			.execute();
	}

	async consumeById(id: number) {
		await this.cvRepo.delete({ id });
	}

	async deleteByPurpose(email: string, purpose: VerificationPurpose) {
		await this.cvRepo.delete({ contactEmail: email, purpose });
	}

	async markEmailAsVerified(email: string) {
		const ce = await this.contactRepo.findOne({ where: { email } });
		if (!ce) throw new NotFoundException('Email record not found');
		ce.isVerified = true;
		await this.contactRepo.save(ce);
	}

	async deleteCodes(email: string): Promise<void> {
		await this.cvRepo.delete({ contactEmail: email });
	}
}
