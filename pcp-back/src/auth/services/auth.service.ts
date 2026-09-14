import {
	BadRequestException,
	ConflictException,
	HttpException,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
	ContactService,
	ContactVerificationService,
} from '../../contacts/services';
import { MailService } from '../../mail/services/mail.service';
import {
	AuthSuccessDto,
	ConfirmResetDto,
	ForgotPasswordDto,
	LoginDto,
	RefreshTokenDto,
	RegisterDto,
	VerifyCodeDto,
} from '../dto';
import { CONFIG } from '../../config/enums';
import { ContactProviderType } from '../../contacts/entities/contact-provider.entity';
import { generateOtp } from '../../common/utils/generate-otp-code';
import { hashCode } from '../../common/utils/hash-code';
import { HASH_SALT, MAX_ATTEMPTS, OTP_TTL_MIN } from '../../common/constants';
import { ChangePasswordDto } from '../dto/forgot-password-change.dto';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class AuthService {
	constructor(
		private readonly configService: ConfigService,
		private readonly contactService: ContactService,
		private readonly verificationService: ContactVerificationService,
		private readonly jwtService: JwtService,
		private readonly mailService: MailService,
	) {}

	private generateToken(user: any): AuthSuccessDto {
		const payload = { sub: user.userId || user.id, email: user.email };
		const access_token = this.jwtService.sign(payload);
		const refresh_token = this.jwtService.sign(payload, {
			expiresIn: this.configService.get<string>(
				CONFIG.JWT_REFRESH_EXPIRES_IN,
			),
		});
		return { access_token, refresh_token };
	}

	issueTokenFor(user: any): AuthSuccessDto {
		return this.generateToken(user);
	}

	async register(dto: RegisterDto) {
		try {
			const hashedPassword = await bcrypt.hash(dto.password, HASH_SALT);

			const createdUser = await this.contactService.create({
				first_name: dto.first_name,
				last_name: dto.last_name,
				email: dto.email.trim().toLowerCase(),
				password: hashedPassword,
			});

			await this.contactService.createProviderRecord(
				createdUser.id,
				ContactProviderType.EMAIL,
			);

			await this.verificationCode(createdUser.email);

			return {
				message:
					'Registration successful. Please check your email for verification code.',
			};
		} catch (error) {
			if (error instanceof QueryFailedError) {
				const pgError = error.driverError;

				if (pgError.code === '23505') {
					throw new ConflictException('Email already exists');
				}
			}

			throw new InternalServerErrorException('Failed to register user');
		}
	}

	async login(dto: LoginDto) {
		const user = await this.contactService.findOneByEmailForAuth(dto.email);
		if (!user) throw new UnauthorizedException('Invalid credentials');

		if (!user.password) {
			throw new UnauthorizedException(
				'This account has no password. Use OAuth or reset password.',
			);
		}

		const isMatch = await bcrypt.compare(dto.password, user.password);
		if (!isMatch) throw new UnauthorizedException('Invalid credentials');

		const emailRec = await this.contactService.findOneByEmail(dto.email);
		if (!emailRec?.isVerified) {
			await this.verificationCode(dto.email);
			throw new UnauthorizedException(
				'Email not verified. Please check your inbox.',
			);
		}

		return this.generateToken(user);
	}

	async refreshToken(dto: RefreshTokenDto): Promise<AuthSuccessDto> {
		try {
			const payload = this.jwtService.verify(dto.refresh_token, {
				secret: this.configService.get<string>(CONFIG.JWT_SECRET),
			}) as { sub: number; email: string };

			const user = await this.contactService.findOneByEmail(
				payload.email,
			);
			if (!user) throw new UnauthorizedException('Invalid token');

			return this.generateToken(user);
		} catch {
			throw new UnauthorizedException('Invalid or expired refresh token');
		}
	}

	async validateGoogleUser(googleProfile: {
		email: string;
		firstName: string;
		lastName: string;
		avatarUrl: string;
	}) {
		let user = await this.contactService.findOneByEmail(
			googleProfile.email,
		);

		if (user) {
			if (!user?.isVerified) {
				await this.verificationService.markEmailAsVerified(
					googleProfile.email,
				);
			}

			const hasProvider = await this.contactService.hasProvider(
				user.id,
				ContactProviderType.GOOGLE,
			);
			if (!hasProvider) {
				await this.contactService.createProviderRecord(
					user.id,
					ContactProviderType.GOOGLE,
				);
			}
		} else {
			user = await this.contactService.createGoogleUser({
				first_name: googleProfile.firstName,
				last_name: googleProfile.lastName,
				email: googleProfile.email,
			});
			if (googleProfile.avatarUrl) {
				try {
					await this.contactService.uploadAvatarFromUrl(
						user.id,
						googleProfile.avatarUrl,
					);
					user = await this.contactService.findOneByEmail(
						googleProfile.email,
					);
				} catch (err) {
					console.warn(
						'Google avatar upload failed',
						err?.message ?? err,
					);
				}
			}
		}

		return user;
	}

	async verificationCode(email: string) {
		const contact = await this.contactService.findOneByEmail(email);
		if (!contact) throw new BadRequestException('User not found');

		const emailRec = await this.contactService.findOneByEmail(email);
		if (emailRec?.isVerified)
			throw new ConflictException('Email already verified');

		const code = generateOtp();
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

		await this.verificationService.deleteCodes(email);
		await this.verificationService.createVerificationRecord({
			contact_email: email,
			purpose: 'email_verify',
			code,
			expires_at: expiresAt.toISOString(),
		});

		await this.mailService.sendMail({
			to: email,
			subject: 'Your Verification Code',
			template: 'verify-email',
			context: { code },
		});
	}

	async verifyCode(dto: VerifyCodeDto) {
		try {
			const user = await this.contactService.findOneByEmail(dto.email);
			if (!user) {
				throw new UnauthorizedException('Invalid credentials');
			}

			const record = await this.verificationService.findVerificationCode({
				email: dto.email,
				code: dto.code,
				purpose: 'email_verify',
			});

			await this.verificationService.consumeById(record.id);
			await this.verificationService.markEmailAsVerified(dto.email);

			return this.generateToken(user);
		} catch (err) {
			if (err instanceof HttpException) throw err;
			throw new UnauthorizedException('Invalid verification code');
		}
	}

	async forgotPassword(dto: ForgotPasswordDto) {
		const contact = await this.contactService.findOneByEmail(dto.email);

		if (!contact) {
			return {
				message:
					'If an account with this email exists, a reset code has been sent',
			};
		}

		const code = generateOtp();
		const codeHash = hashCode(code);

		await this.verificationService.createVerificationRecord({
			contact_email: contact.email,
			purpose: 'password_reset',
			code: codeHash,
			expires_at: new Date(Date.now() + OTP_TTL_MIN * 60_000),
		});

		await this.mailService.sendMail({
			to: contact.email,
			subject: 'Your password reset code',
			template: 'reset-password',
			context: {
				code,
				ttlMinutes: OTP_TTL_MIN,
				email: contact.email,
			},
		});

		return {
			message:
				'If an account with this email exists, a reset code has been sent',
		};
	}

	async confirmReset(dto: ConfirmResetDto): Promise<{ token: string }> {
		const contact = await this.contactService.findOneByEmail(dto.email);
		if (!contact) throw new BadRequestException('User not found');

		const rec = await this.verificationService.findLatestActiveByPurpose(
			contact.email,
			'password_reset',
		);
		if (!rec) throw new BadRequestException('No active reset request');

		if (rec.expiresAt.getTime() < Date.now()) {
			await this.verificationService.consumeById(rec.id);
			throw new BadRequestException('Code expired');
		}

		if (rec.attempts >= MAX_ATTEMPTS) {
			await this.verificationService.consumeById(rec.id);
			throw new BadRequestException('Too many attempts');
		}

		const isValid = hashCode(dto.code) === rec.code;
		if (!isValid) {
			await this.verificationService.incrementAttempts(rec.id);
			throw new BadRequestException('Invalid code');
		}

		await this.verificationService.consumeById(rec.id);

		const payload = {
			sub: contact.id.toString(),
			email: contact.email,
			purpose: 'password_reset',
		};
		const token = this.jwtService.sign(payload, { expiresIn: '15m' });

		return { token };
	}

	async changePasswordWithToken(
		dto: ChangePasswordDto,
	): Promise<{ message: string }> {
		let payload: any;
		try {
			payload = this.jwtService.verify(dto.token);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (err) {
			throw new UnauthorizedException('Invalid or expired token');
		}

		if (payload.purpose !== 'password_reset') {
			throw new UnauthorizedException('Invalid token purpose');
		}

		const userId = payload.sub;
		const contact = await this.contactService.findContactById(userId);
		if (!contact) throw new BadRequestException('User not found');

		await this.contactService.resetPassword(
			contact.id.toString(),
			dto.newPassword,
		);

		return { message: 'Password updated' };
	}
}
