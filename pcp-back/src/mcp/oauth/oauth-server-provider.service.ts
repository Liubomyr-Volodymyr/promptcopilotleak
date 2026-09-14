import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import {
	AuthorizationParams,
	OAuthServerProvider,
} from '@modelcontextprotocol/sdk/server/auth/provider.js';
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { InvalidGrantError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import {
	OAuthClientInformationFull,
	OAuthTokenRevocationRequest,
	OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import { CONFIG } from '../../config/enums';
import { RedisService } from '../../redis/services/redis.service';
import { OAuthClientsStoreService } from './oauth-clients-store.service';

type PendingAuthorizationRequest = {
	clientId: string;
	redirectUri: string;
	codeChallenge: string;
	state?: string;
	scopes?: string[];
	resource?: string;
};

type AuthorizationCodeRecord = {
	clientId: string;
	redirectUri: string;
	codeChallenge: string;
	userId: string;
	email: string;
	scopes: string[];
	resource?: string;
};

type McpTokenPayload = {
	sub: string;
	email: string;
	client_id: string;
	scope: string;
	aud: string;
	token_use: 'mcp_access' | 'mcp_refresh';
	jti: string;
	exp?: number;
	iat?: number;
};

const AUTHORIZATION_REQUEST_TTL_SEC = 600;
const AUTHORIZATION_CODE_TTL_SEC = 60;

@Injectable()
export class PcpOAuthServerProvider implements OAuthServerProvider {
	constructor(
		private readonly clientsStoreService: OAuthClientsStoreService,
		private readonly redisService: RedisService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	get clientsStore(): OAuthClientsStoreService {
		return this.clientsStoreService;
	}

	async authorize(
		client: OAuthClientInformationFull,
		params: AuthorizationParams,
		res: Response,
	): Promise<void> {
		const requestId = randomUUID();
		const pending: PendingAuthorizationRequest = {
			clientId: client.client_id,
			redirectUri: params.redirectUri,
			codeChallenge: params.codeChallenge,
			state: params.state,
			scopes: params.scopes,
			resource: params.resource?.href,
		};

		await this.redisService.set(
			this.requestKey(requestId),
			JSON.stringify(pending),
			AUTHORIZATION_REQUEST_TTL_SEC,
		);

		const frontendUrl = this.configService.getOrThrow<string>(
			CONFIG.EXTENSION_FRONTEND_URL,
		);
		const consentUrl = new URL('/mcp/authorize', frontendUrl);
		consentUrl.searchParams.set('request_id', requestId);

		res.redirect(consentUrl.href);
	}

	async getPendingRequest(
		requestId: string,
	): Promise<PendingAuthorizationRequest | null> {
		const raw = await this.redisService.get(this.requestKey(requestId));
		return raw ? (JSON.parse(raw) as PendingAuthorizationRequest) : null;
	}

	async completeAuthorization(
		requestId: string,
		user: { userId: string; email: string },
		approve: boolean,
	): Promise<string> {
		const pending = await this.getPendingRequest(requestId);
		if (!pending) {
			throw new NotFoundException(
				'Authorization request not found or expired',
			);
		}
		await this.redisService.del(this.requestKey(requestId));

		const redirectTo = new URL(pending.redirectUri);
		if (pending.state) redirectTo.searchParams.set('state', pending.state);

		if (!approve) {
			redirectTo.searchParams.set('error', 'access_denied');
			return redirectTo.href;
		}

		const code = randomUUID();
		const record: AuthorizationCodeRecord = {
			clientId: pending.clientId,
			redirectUri: pending.redirectUri,
			codeChallenge: pending.codeChallenge,
			userId: user.userId,
			email: user.email,
			scopes: pending.scopes ?? [],
			resource: pending.resource,
		};
		await this.redisService.set(
			this.codeKey(code),
			JSON.stringify(record),
			AUTHORIZATION_CODE_TTL_SEC,
		);

		redirectTo.searchParams.set('code', code);
		return redirectTo.href;
	}

	async challengeForAuthorizationCode(
		_client: OAuthClientInformationFull,
		authorizationCode: string,
	): Promise<string> {
		const record = await this.getCodeRecord(authorizationCode);
		return record.codeChallenge;
	}

	async exchangeAuthorizationCode(
		client: OAuthClientInformationFull,
		authorizationCode: string,
		_codeVerifier?: string,
		redirectUri?: string,
	): Promise<OAuthTokens> {
		const raw = await this.redisService.getDel(
			this.codeKey(authorizationCode),
		);
		if (!raw) {
			throw new InvalidGrantError(
				'Authorization code expired or already used',
			);
		}
		const record = JSON.parse(raw) as AuthorizationCodeRecord;
		if (record.clientId !== client.client_id) {
			throw new InvalidGrantError(
				'Authorization code was issued to another client',
			);
		}
		if (redirectUri && redirectUri !== record.redirectUri) {
			throw new InvalidGrantError(
				'redirect_uri does not match the authorization request',
			);
		}

		return this.mintTokens({
			userId: record.userId,
			email: record.email,
			clientId: record.clientId,
			scopes: record.scopes,
			resource: record.resource ?? this.resourceServerUrl(),
		});
	}

	async exchangeRefreshToken(
		client: OAuthClientInformationFull,
		refreshToken: string,
		scopes?: string[],
	): Promise<OAuthTokens> {
		const payload = await this.verifyToken(refreshToken, 'mcp_refresh');
		if (payload.client_id !== client.client_id) {
			throw new InvalidGrantError(
				'Refresh token was issued to another client',
			);
		}
		if (await this.isRevoked(payload.jti)) {
			throw new InvalidGrantError('Refresh token has been revoked');
		}
		await this.revoke(payload.jti, payload);

		return this.mintTokens({
			userId: payload.sub,
			email: payload.email,
			clientId: payload.client_id,
			scopes: scopes ?? payload.scope.split(' ').filter(Boolean),
			resource: payload.aud,
		});
	}

	async verifyAccessToken(token: string): Promise<AuthInfo> {
		const payload = await this.verifyToken(token, 'mcp_access');
		if (await this.isRevoked(payload.jti)) {
			throw new InvalidGrantError('Access token has been revoked');
		}

		const decoded = this.jwtService.decode(token) as { exp?: number };

		return {
			token,
			clientId: payload.client_id,
			scopes: payload.scope.split(' ').filter(Boolean),
			expiresAt: decoded?.exp,
			resource: new URL(payload.aud),
			extra: { userId: payload.sub, email: payload.email },
		};
	}

	async revokeToken(
		_client: OAuthClientInformationFull,
		request: OAuthTokenRevocationRequest,
	): Promise<void> {
		try {
			const payload = this.jwtService.decode(
				request.token,
			) as McpTokenPayload | null;
			if (!payload?.jti) return;
			await this.revoke(payload.jti, payload);
		} catch {
			// Invalid/garbage tokens are already unusable — nothing to revoke.
		}
	}

	private async mintTokens(input: {
		userId: string;
		email: string;
		clientId: string;
		scopes: string[];
		resource: string;
	}): Promise<OAuthTokens> {
		const accessTtl = this.configService.get<string>(
			CONFIG.MCP_ACCESS_TOKEN_TTL,
			'1h',
		);
		const refreshTtl = this.configService.get<string>(
			CONFIG.MCP_REFRESH_TOKEN_TTL,
			'30d',
		);
		const scope = input.scopes.join(' ');

		const accessToken = this.sign(input, 'mcp_access', scope, accessTtl);
		const refreshToken = this.sign(input, 'mcp_refresh', scope, refreshTtl);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
			token_type: 'bearer',
			expires_in: this.ttlToSeconds(accessTtl),
			scope,
		};
	}

	private ttlToSeconds(ttl: string): number {
		const match = /^(\d+)(s|m|h|d)?$/.exec(ttl.trim());
		if (!match) return 3600;

		const value = Number(match[1]);
		const unit = match[2] ?? 's';
		const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
		return value * multiplier;
	}

	private sign(
		input: {
			userId: string;
			email: string;
			clientId: string;
			resource: string;
		},
		tokenUse: McpTokenPayload['token_use'],
		scope: string,
		ttl: string,
	): string {
		const payload: Omit<McpTokenPayload, 'jti'> = {
			sub: input.userId,
			email: input.email,
			client_id: input.clientId,
			scope,
			aud: input.resource,
			token_use: tokenUse,
		};
		return this.jwtService.sign(
			{ ...payload, jti: randomUUID() },
			{ expiresIn: ttl },
		);
	}

	private async verifyToken(
		token: string,
		expectedUse: McpTokenPayload['token_use'],
	): Promise<McpTokenPayload> {
		let payload: McpTokenPayload;
		try {
			payload = this.jwtService.verify<McpTokenPayload>(token);
		} catch {
			throw new InvalidGrantError('Invalid or expired token');
		}
		if (payload.token_use !== expectedUse) {
			throw new InvalidGrantError(
				'Token is not valid for this operation',
			);
		}
		if (payload.aud !== this.resourceServerUrl()) {
			throw new InvalidGrantError(
				'Token was not issued for this resource',
			);
		}
		return payload;
	}

	private async isRevoked(jti: string): Promise<boolean> {
		return (await this.redisService.get(this.revokedKey(jti))) !== null;
	}

	private async revoke(
		jti: string,
		payload: { exp?: number } | null,
	): Promise<void> {
		const remaining = payload?.exp
			? payload.exp - Math.floor(Date.now() / 1000)
			: 0;
		await this.redisService.set(
			this.revokedKey(jti),
			'1',
			Math.max(remaining, 60),
		);
	}

	private async getCodeRecord(
		code: string,
	): Promise<AuthorizationCodeRecord> {
		const raw = await this.redisService.get(this.codeKey(code));
		if (!raw) {
			throw new InvalidGrantError(
				'Authorization code expired or already used',
			);
		}
		return JSON.parse(raw) as AuthorizationCodeRecord;
	}

	private resourceServerUrl(): string {
		const apiUrl = this.configService.getOrThrow<string>(CONFIG.API_URL);
		return new URL('/api/mcp', apiUrl).href;
	}

	private requestKey(requestId: string): string {
		return `mcp:oauth:req:${requestId}`;
	}

	private codeKey(code: string): string {
		return `mcp:oauth:code:${code}`;
	}

	private revokedKey(jti: string): string {
		return `mcp:oauth:revoked:${jti}`;
	}
}
