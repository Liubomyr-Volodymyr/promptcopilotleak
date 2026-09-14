import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ApiAdminLogin } from './docs/api-admin-login.decorator';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@ApiTags('Admin Auth')
@Controller()
export class AdminAuthController {
	constructor(private readonly adminAuthService: AdminAuthService) {}

	@Post('login')
	@ApiAdminLogin()
	async login(@Body() body: AdminLoginDto) {
		return this.adminAuthService.login(body);
	}

	@Get('me')
	@UseGuards(AdminJwtGuard)
	@ApiBearerAuth()
	async getMe(@Req() req: any) {
		const admin = await this.adminAuthService.validateById(
			Number(req.user.id),
		);
		return {
			email: admin.email,
			firstName: admin.firstName,
			lastName: admin.lastName,
		};
	}
}
