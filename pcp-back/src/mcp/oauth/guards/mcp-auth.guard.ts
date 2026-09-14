import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { CONFIG } from '../../../config/enums';
import { PcpOAuthServerProvider } from '../oauth-server-provider.service';

@Injectable()
export class McpAuthGuard implements CanActivate {
	constructor(
		private readonly provider: PcpOAuthServerProvider,
		private readonly configService: ConfigService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();
		const authHeader = request.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			this.reject(response);
		}

		const token = authHeader.slice('Bearer '.length);

		try {
			const authInfo = await this.provider.verifyAccessToken(token);
			request.user = {
				userId: authInfo.extra?.userId,
				email: authInfo.extra?.email,
			};
			return true;
		} catch {
			this.reject(response);
		}
	}

	private reject(response: any): never {
		const apiUrl = this.configService.getOrThrow<string>(CONFIG.API_URL);
		const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(
			new URL('/api/mcp', apiUrl),
		);
		response.setHeader(
			'WWW-Authenticate',
			`Bearer resource_metadata="${resourceMetadataUrl}"`,
		);
		throw new UnauthorizedException('Invalid or missing access token');
	}
}
