import {
	BadRequestException,
	ConflictException,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { AuthService } from './auth.service';
import { ContactProviderType } from '../../contacts/entities/contact-provider.entity';
import { hashCode } from '../../common/utils/hash-code';
import { MAX_ATTEMPTS } from '../../common/constants';

jest.mock('bcrypt');
jest.mock('../../common/utils/generate-otp-code', () => ({
	generateOtp: () => '123456',
}));

const mockContactService = {
	create: jest.fn(),
	createProviderRecord: jest.fn(),
	findOneByEmailForAuth: jest.fn(),
	findOneByEmail: jest.fn(),
	hasProvider: jest.fn(),
	createGoogleUser: jest.fn(),
	uploadAvatarFromUrl: jest.fn(),
	findContactById: jest.fn(),
	resetPassword: jest.fn(),
};

const mockVerificationService = {
	deleteCodes: jest.fn(),
	createVerificationRecord: jest.fn(),
	findVerificationCode: jest.fn(),
	consumeById: jest.fn(),
	markEmailAsVerified: jest.fn(),
	findLatestActiveByPurpose: jest.fn(),
	incrementAttempts: jest.fn(),
};

const mockJwtService = {
	sign: jest.fn().mockReturnValue('signed-token'),
	verify: jest.fn(),
};

const mockMailService = {
	sendMail: jest.fn().mockResolvedValue(true),
};

const mockConfigService = {
	get: jest.fn().mockReturnValue('secret'),
};

describe('AuthService', () => {
	let service: AuthService;

	beforeEach(() => {
		jest.resetAllMocks();
		mockMailService.sendMail.mockResolvedValue(true);
		mockJwtService.sign.mockReturnValue('signed-token');
		mockConfigService.get.mockReturnValue('secret');

		service = new AuthService(
			mockConfigService as any,
			mockContactService as any,
			mockVerificationService as any,
			mockJwtService as any,
			mockMailService as any,
		);
	});

	describe('register', () => {
		const dto = {
			first_name: 'John',
			last_name: 'Doe',
			email: 'john@example.com',
			password: 'pass123',
		};

		beforeEach(() => {
			(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pass');
			mockContactService.create.mockResolvedValue({
				id: 1,
				email: dto.email,
			});
			mockContactService.findOneByEmail.mockResolvedValue({
				id: 1,
				email: dto.email,
				isVerified: false,
			});
		});

		it('creates user, provider record, and sends verification email', async () => {
			const result = await service.register(dto);

			expect(bcrypt.hash).toHaveBeenCalledWith(
				dto.password,
				expect.any(Number),
			);
			expect(mockContactService.create).toHaveBeenCalledWith(
				expect.objectContaining({ email: dto.email }),
			);
			expect(
				mockContactService.createProviderRecord,
			).toHaveBeenCalledWith(1, ContactProviderType.EMAIL);
			expect(result.message).toContain('Registration successful');
		});

		it('throws ConflictException when email already exists', async () => {
			const pgError = Object.assign(
				new QueryFailedError('', [], new Error()),
				{
					driverError: { code: '23505' },
				},
			);
			mockContactService.create.mockRejectedValue(pgError);

			await expect(service.register(dto)).rejects.toThrow(
				ConflictException,
			);
		});

		it('throws InternalServerErrorException for unexpected errors', async () => {
			mockContactService.create.mockRejectedValue(new Error('db down'));

			await expect(service.register(dto)).rejects.toThrow(
				InternalServerErrorException,
			);
		});
	});

	describe('login', () => {
		const dto = { email: 'john@example.com', password: 'pass123' };
		const user = { id: 1, email: dto.email, password: 'hashed' };

		it('returns tokens when credentials are valid and email is verified', async () => {
			mockContactService.findOneByEmailForAuth.mockResolvedValue(user);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			mockContactService.findOneByEmail.mockResolvedValue({
				...user,
				isVerified: true,
			});

			const result = await service.login(dto);

			expect(result.access_token).toBeDefined();
			expect(result.refresh_token).toBeDefined();
		});

		it('throws UnauthorizedException when user not found', async () => {
			mockContactService.findOneByEmailForAuth.mockResolvedValue(null);

			await expect(service.login(dto)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('throws UnauthorizedException when user has no password', async () => {
			mockContactService.findOneByEmailForAuth.mockResolvedValue({
				...user,
				password: null,
			});

			await expect(service.login(dto)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('throws UnauthorizedException when password does not match', async () => {
			mockContactService.findOneByEmailForAuth.mockResolvedValue(user);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await expect(service.login(dto)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('throws UnauthorizedException and sends code when email not verified', async () => {
			mockContactService.findOneByEmailForAuth.mockResolvedValue(user);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			mockContactService.findOneByEmail.mockResolvedValue({
				...user,
				isVerified: false,
			});

			await expect(service.login(dto)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	describe('refreshToken', () => {
		it('returns new tokens for a valid refresh token', async () => {
			mockJwtService.verify.mockReturnValue({ sub: 1, email: 'a@b.com' });
			mockContactService.findOneByEmail.mockResolvedValue({
				id: 1,
				email: 'a@b.com',
			});

			const result = await service.refreshToken({
				refresh_token: 'valid-refresh',
			});

			expect(result.access_token).toBeDefined();
		});

		it('throws UnauthorizedException when token is invalid', async () => {
			mockJwtService.verify.mockImplementation(() => {
				throw new Error('invalid');
			});

			await expect(
				service.refreshToken({ refresh_token: 'bad-token' }),
			).rejects.toThrow(UnauthorizedException);
		});

		it('throws UnauthorizedException when user no longer exists', async () => {
			mockJwtService.verify.mockReturnValue({ sub: 1, email: 'a@b.com' });
			mockContactService.findOneByEmail.mockResolvedValue(null);

			await expect(
				service.refreshToken({ refresh_token: 'valid-refresh' }),
			).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('validateGoogleUser', () => {
		const profile = {
			email: 'g@example.com',
			firstName: 'Jane',
			lastName: 'Smith',
			avatarUrl: 'http://photo.jpg',
		};

		it('returns existing verified user without creating provider again', async () => {
			const existing = { id: 5, email: profile.email, isVerified: true };
			mockContactService.findOneByEmail.mockResolvedValue(existing);
			mockContactService.hasProvider.mockResolvedValue(true);

			const result = await service.validateGoogleUser(profile);

			expect(result).toBe(existing);
			expect(
				mockContactService.createProviderRecord,
			).not.toHaveBeenCalled();
		});

		it('marks email verified and adds google provider for unverified existing user', async () => {
			const existing = { id: 5, email: profile.email, isVerified: false };
			mockContactService.findOneByEmail.mockResolvedValue(existing);
			mockContactService.hasProvider.mockResolvedValue(false);

			await service.validateGoogleUser(profile);

			expect(
				mockVerificationService.markEmailAsVerified,
			).toHaveBeenCalledWith(profile.email);
			expect(
				mockContactService.createProviderRecord,
			).toHaveBeenCalledWith(existing.id, ContactProviderType.GOOGLE);
		});

		it('creates a new google user when no existing user found', async () => {
			const newUser = { id: 9, email: profile.email };
			mockContactService.findOneByEmail
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(newUser);
			mockContactService.createGoogleUser.mockResolvedValue(newUser);
			mockContactService.uploadAvatarFromUrl.mockResolvedValue(undefined);

			const result = await service.validateGoogleUser(profile);

			expect(mockContactService.createGoogleUser).toHaveBeenCalledWith(
				expect.objectContaining({ email: profile.email }),
			);
			expect(result).toBe(newUser);
		});

		it('continues without avatar when upload fails', async () => {
			const newUser = { id: 9, email: profile.email };
			mockContactService.findOneByEmail
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(newUser);
			mockContactService.createGoogleUser.mockResolvedValue(newUser);
			mockContactService.uploadAvatarFromUrl.mockRejectedValue(
				new Error('upload failed'),
			);

			await expect(
				service.validateGoogleUser(profile),
			).resolves.not.toThrow();
		});
	});

	describe('verificationCode', () => {
		it('creates verification record and sends email', async () => {
			mockContactService.findOneByEmail.mockResolvedValue({
				id: 1,
				email: 'a@b.com',
				isVerified: false,
			});

			await service.verificationCode('a@b.com');

			expect(
				mockVerificationService.createVerificationRecord,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					purpose: 'email_verify',
					code: '123456',
				}),
			);
			expect(mockMailService.sendMail).toHaveBeenCalled();
		});

		it('throws BadRequestException when user not found', async () => {
			mockContactService.findOneByEmail.mockResolvedValue(null);

			await expect(service.verificationCode('x@x.com')).rejects.toThrow(
				BadRequestException,
			);
		});

		it('throws ConflictException when email already verified', async () => {
			mockContactService.findOneByEmail.mockResolvedValue({
				id: 1,
				email: 'a@b.com',
				isVerified: true,
			});

			await expect(service.verificationCode('a@b.com')).rejects.toThrow(
				ConflictException,
			);
		});
	});

	describe('verifyCode', () => {
		const dto = { email: 'a@b.com', code: '123456' };
		const user = { id: 1, email: dto.email };
		const record = { id: 10 };

		it('returns tokens after consuming and marking email verified', async () => {
			mockContactService.findOneByEmail.mockResolvedValue(user);
			mockVerificationService.findVerificationCode.mockResolvedValue(
				record,
			);

			const result = await service.verifyCode(dto);

			expect(mockVerificationService.consumeById).toHaveBeenCalledWith(
				record.id,
			);
			expect(
				mockVerificationService.markEmailAsVerified,
			).toHaveBeenCalledWith(dto.email);
			expect(result.access_token).toBeDefined();
		});

		it('throws UnauthorizedException when user not found', async () => {
			mockContactService.findOneByEmail.mockResolvedValue(null);

			await expect(service.verifyCode(dto)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('throws UnauthorizedException when verification record lookup fails', async () => {
			mockContactService.findOneByEmail.mockResolvedValue(user);
			mockVerificationService.findVerificationCode.mockRejectedValue(
				new Error('not found'),
			);

			await expect(service.verifyCode(dto)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	describe('forgotPassword', () => {
		it('creates reset record and sends email', async () => {
			const contact = { id: 1, email: 'a@b.com' };
			mockContactService.findOneByEmail.mockResolvedValue(contact);

			const result = await service.forgotPassword({ email: 'a@b.com' });

			expect(
				mockVerificationService.createVerificationRecord,
			).toHaveBeenCalledWith(
				expect.objectContaining({ purpose: 'password_reset' }),
			);
			expect(mockMailService.sendMail).toHaveBeenCalled();
			expect(result.message).toBe('If an account with this email exists, a reset code has been sent');
		});

		it('returns generic message when user not found', async () => {
			mockContactService.findOneByEmail.mockResolvedValue(null);

			const result = await service.forgotPassword({ email: 'unknown@x.com' });

			expect(result.message).toBe('If an account with this email exists, a reset code has been sent');
		});
	});

	describe('confirmReset', () => {
		const dto = { email: 'a@b.com', code: '123456' };
		const contact = { id: 1, email: dto.email };
		const futureDate = new Date(Date.now() + 60_000);

		it('returns a short-lived token when code is valid', async () => {
			const rec = {
				id: 20,
				code: hashCode(dto.code),
				expiresAt: futureDate,
				attempts: 0,
			};
			mockContactService.findOneByEmail.mockResolvedValue(contact);
			mockVerificationService.findLatestActiveByPurpose.mockResolvedValue(
				rec,
			);

			const result = await service.confirmReset(dto);

			expect(result.token).toBeDefined();
			expect(mockVerificationService.consumeById).toHaveBeenCalledWith(
				rec.id,
			);
		});

		it('throws BadRequestException when user not found', async () => {
			mockContactService.findOneByEmail.mockResolvedValue(null);

			await expect(service.confirmReset(dto)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('throws BadRequestException when no active reset record exists', async () => {
			mockContactService.findOneByEmail.mockResolvedValue(contact);
			mockVerificationService.findLatestActiveByPurpose.mockResolvedValue(
				null,
			);

			await expect(service.confirmReset(dto)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('throws BadRequestException and consumes record when code is expired', async () => {
			const rec = {
				id: 20,
				code: hashCode(dto.code),
				expiresAt: new Date(Date.now() - 1000),
				attempts: 0,
			};
			mockContactService.findOneByEmail.mockResolvedValue(contact);
			mockVerificationService.findLatestActiveByPurpose.mockResolvedValue(
				rec,
			);

			await expect(service.confirmReset(dto)).rejects.toThrow(
				BadRequestException,
			);
			expect(mockVerificationService.consumeById).toHaveBeenCalledWith(
				rec.id,
			);
		});

		it('throws BadRequestException and consumes record when max attempts reached', async () => {
			const rec = {
				id: 20,
				code: hashCode(dto.code),
				expiresAt: futureDate,
				attempts: MAX_ATTEMPTS,
			};
			mockContactService.findOneByEmail.mockResolvedValue(contact);
			mockVerificationService.findLatestActiveByPurpose.mockResolvedValue(
				rec,
			);

			await expect(service.confirmReset(dto)).rejects.toThrow(
				BadRequestException,
			);
			expect(mockVerificationService.consumeById).toHaveBeenCalledWith(
				rec.id,
			);
		});

		it('increments attempts and throws when code is invalid', async () => {
			const rec = {
				id: 20,
				code: hashCode('wrong-code'),
				expiresAt: futureDate,
				attempts: 0,
			};
			mockContactService.findOneByEmail.mockResolvedValue(contact);
			mockVerificationService.findLatestActiveByPurpose.mockResolvedValue(
				rec,
			);

			await expect(service.confirmReset(dto)).rejects.toThrow(
				BadRequestException,
			);
			expect(
				mockVerificationService.incrementAttempts,
			).toHaveBeenCalledWith(rec.id);
		});
	});

	describe('changePasswordWithToken', () => {
		const dto = { token: 'reset-token', newPassword: 'new-pass' };

		it('resets password when token and purpose are valid', async () => {
			mockJwtService.verify.mockReturnValue({
				sub: '1',
				email: 'a@b.com',
				purpose: 'password_reset',
			});
			mockContactService.findContactById.mockResolvedValue({
				id: 1,
				email: 'a@b.com',
			});

			const result = await service.changePasswordWithToken(dto);

			expect(mockContactService.resetPassword).toHaveBeenCalledWith(
				'1',
				dto.newPassword,
			);
			expect(result.message).toBe('Password updated');
		});

		it('throws UnauthorizedException when token is invalid', async () => {
			mockJwtService.verify.mockImplementation(() => {
				throw new Error('expired');
			});

			await expect(service.changePasswordWithToken(dto)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('throws UnauthorizedException when token purpose is wrong', async () => {
			mockJwtService.verify.mockReturnValue({
				sub: '1',
				email: 'a@b.com',
				purpose: 'email_verify',
			});

			await expect(service.changePasswordWithToken(dto)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('throws BadRequestException when user no longer exists', async () => {
			mockJwtService.verify.mockReturnValue({
				sub: '1',
				email: 'a@b.com',
				purpose: 'password_reset',
			});
			mockContactService.findContactById.mockResolvedValue(null);

			await expect(service.changePasswordWithToken(dto)).rejects.toThrow(
				BadRequestException,
			);
		});
	});
});
