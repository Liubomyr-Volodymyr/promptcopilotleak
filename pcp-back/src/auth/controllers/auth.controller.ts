import { Request, Response } from 'express';
import {
	Body,
	Controller,
	Post,
	Patch,
	Req,
	UseGuards,
	Get,
	Res,
	HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { EmailThrottlerGuard, JwtAuthGuard } from '../guards';
import {
	LoginDto,
	RefreshTokenDto,
	RegisterDto,
	ResendCodeDto,
	VerifyCodeDto,
	ForgotPasswordDto,
	ConfirmResetDto,
} from '../dto';
import {
	ApiGetMe,
	ApiLogin,
	ApiRegister,
	ApiResendCode,
	ApiUpdatePassword,
	ApiVerifyCode,
	ApiForgotPassword,
	ApiConfirmReset,
} from '../docs';
import { ContactService } from '../../contacts/services';
import { UpdatePasswordDto } from '../../contacts/dto';
import { ConfigService } from '@nestjs/config';
import { CONFIG } from '../../config/enums';
import { ChangePasswordDto } from '../dto/forgot-password-change.dto';
import { ApiChangeForgotPassword } from '../docs/api-change-forgot-password.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(
		private readonly configService: ConfigService,
		private readonly authService: AuthService,
		private readonly contactService: ContactService,
	) {}

	@Post('register')
	@ApiRegister()
	async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post('login')
	@ApiLogin()
	async login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	@Post('refresh')
	async refreshToken(@Body() dto: RefreshTokenDto) {
		return this.authService.refreshToken(dto);
	}

	@Get('google/web')
	@UseGuards(AuthGuard('google-web'))
	async googleWebAuth() {}

	@Get('google/web/callback')
	@UseGuards(AuthGuard('google-web'))
	async googleWebCallback(@Req() req: Request, @Res() res: Response) {
		const tokens = this.authService.issueTokenFor(req.user);

		const frontendUrl = this.configService.get(
			CONFIG.EXTENSION_FRONTEND_URL,
		);
		res.redirect(
			`${frontendUrl}/auth/callback?token=${tokens.access_token}&refresh=${tokens.refresh_token}`,
		);
	}

	@Post('forgot-password')
	@ApiForgotPassword()
	@UseGuards(EmailThrottlerGuard)
	async forgotPassword(@Body() dto: ForgotPasswordDto) {
		return await this.authService.forgotPassword(dto);
	}

	@Post('forgot-password/confirm')
	@ApiConfirmReset()
	async confirmReset(@Body() dto: ConfirmResetDto) {
		return this.authService.confirmReset(dto);
	}

	@Post('forgot-password/change')
	@ApiChangeForgotPassword()
	@HttpCode(200)
	async changePassword(@Body() dto: ChangePasswordDto) {
		return this.authService.changePasswordWithToken(dto);
	}

	@Patch('update-password')
	@ApiUpdatePassword()
	@UseGuards(JwtAuthGuard)
	async updatePassword(@Body() dto: UpdatePasswordDto, @Req() req: Request) {
		return await this.contactService.updatePassword(req.user.userId, dto);
	}

	@Throttle({ default: { limit: 2, ttl: 60000 } })
	@UseGuards(EmailThrottlerGuard)
	@Post('verify-code')
	@ApiVerifyCode()
	async verifyCode(@Body() dto: VerifyCodeDto) {
		return this.authService.verifyCode(dto);
	}

	@Throttle({ default: { limit: 2, ttl: 60000 } })
	@UseGuards(EmailThrottlerGuard)
	@Post('resend-code')
	@ApiResendCode()
	async resendCode(@Body() dto: ResendCodeDto) {
		return this.authService.verificationCode(dto.email);
	}

	@Get('me')
	@ApiGetMe()
	@UseGuards(JwtAuthGuard)
	async getProfile(@Req() req: Request) {
		return await this.contactService.getProfile(req.user.userId);
	}
}
