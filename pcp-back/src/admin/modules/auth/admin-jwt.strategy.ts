import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AdminAuthService } from './services/admin-auth.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
	constructor(private authService: AdminAuthService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.ADMIN_JWT_SECRET,
		});
	}

	async validate(payload: { sub: number; email: string }) {
		const admin = await this.authService.validateById(payload.sub);
		if (!admin || !admin.isActive) return null;
		return { id: admin.id, email: admin.email, role: admin.role };
	}
}
