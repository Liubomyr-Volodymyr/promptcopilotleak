import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken'; 
import { CONFIG } from '../../config/enums';

@Injectable()
export class AnyJwtAuthGuard implements CanActivate {
	private readonly userSecret: string;
	private readonly adminSecret: string;

	constructor(private readonly configService: ConfigService) {
		this.userSecret =
			this.configService.get<string>(CONFIG.JWT_SECRET) ||
			process.env.JWT_SECRET;
			
		this.adminSecret =
			this.configService.get<string>(CONFIG.ADMIN_JWT_SECRET) ||
			process.env.ADMIN_JWT_SECRET;

		if (!this.userSecret || !this.adminSecret) {
			console.error('CRITICAL: JWT Secrets are missing in environment variables!');
		}
	}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new UnauthorizedException('Missing token');
		}

		const token = authHeader.split(' ')[1];

		try {
			const userPayload = jwt.verify(token, this.userSecret) as jwt.JwtPayload;
			request.user = {
				userId: String(userPayload.sub),
				email: userPayload.email,
				role: 'user',
			};
			return true;
		} catch (userError) {
			if (userError.name !== 'TokenExpiredError' && userError.name !== 'JsonWebTokenError') {
				console.warn('User token verify unexpected error:', userError.message);
			}
		}

		try {
			const adminPayload = jwt.verify(token, this.adminSecret) as jwt.JwtPayload;
			request.user = {
				userId: String(adminPayload.sub),
				id: adminPayload.sub,
				email: adminPayload.email,
				role: adminPayload.role || 'admin',
			};
			return true;
		} catch (adminError) {
			console.error('AnyJwtAuthGuard: Both user and admin verification failed');
			throw new UnauthorizedException('Invalid or expired token');
		}
	}
}