import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AnyJwtAuthGuard } from './any-jwt.guard';

jest.mock('jsonwebtoken');

const USER_SECRET = 'user-secret';
const ADMIN_SECRET = 'admin-secret';

const mockConfigService = {
	get: jest.fn((key: string) => {
		if (key === 'JWT_SECRET') return USER_SECRET;
		if (key === 'ADMIN_JWT_SECRET') return ADMIN_SECRET;
		return undefined;
	}),
};

const buildContext = (authHeader?: string): ExecutionContext => {
	const request: any = {
		headers: authHeader ? { authorization: authHeader } : {},
	};
	return {
		switchToHttp: () => ({ getRequest: () => request }),
		_request: request,
	} as unknown as ExecutionContext;
};

describe('AnyJwtAuthGuard', () => {
	let guard: AnyJwtAuthGuard;

	beforeEach(() => {
		jest.resetAllMocks();
		mockConfigService.get.mockImplementation((key: string) => {
			if (key === 'JWT_SECRET') return USER_SECRET;
			if (key === 'ADMIN_JWT_SECRET') return ADMIN_SECRET;
			return undefined;
		});
		guard = new AnyJwtAuthGuard(mockConfigService as any);
	});

	it('throws UnauthorizedException when Authorization header is missing', () => {
		expect(() => guard.canActivate(buildContext())).toThrow(
			UnauthorizedException,
		);
	});

	it('throws UnauthorizedException when header does not start with Bearer', () => {
		expect(() => guard.canActivate(buildContext('Basic abc'))).toThrow(
			UnauthorizedException,
		);
	});

	it('sets user from user secret and returns true when user token is valid', () => {
		const payload = { sub: '42', email: 'a@b.com' };
		(jwt.verify as jest.Mock).mockImplementation((token, secret) => {
			if (secret === USER_SECRET) return payload;
			throw new Error('invalid');
		});

		const ctx = buildContext('Bearer valid-user-token');
		const result = guard.canActivate(ctx);
		const request = ctx.switchToHttp().getRequest();

		expect(result).toBe(true);
		expect(request.user).toEqual({
			userId: '42',
			email: 'a@b.com',
			role: 'user',
		});
	});

	it('falls back to admin secret and sets admin user when user token fails', () => {
		const adminPayload = { sub: '1', email: 'admin@b.com', role: 'admin' };
		(jwt.verify as jest.Mock).mockImplementation(
			(token: string, secret: string) => {
				if (secret === USER_SECRET)
					throw Object.assign(new Error(), {
						name: 'JsonWebTokenError',
					});
				return adminPayload;
			},
		);

		const ctx = buildContext('Bearer valid-admin-token');
		const result = guard.canActivate(ctx);
		const request = ctx.switchToHttp().getRequest();

		expect(result).toBe(true);
		expect(request.user.role).toBe('admin');
	});

	it('throws UnauthorizedException when both user and admin verification fail', () => {
		(jwt.verify as jest.Mock).mockImplementation(() => {
			throw Object.assign(new Error('invalid'), {
				name: 'JsonWebTokenError',
			});
		});

		expect(() =>
			guard.canActivate(buildContext('Bearer bad-token')),
		).toThrow(UnauthorizedException);
	});

	it('defaults role to admin when payload has no role field', () => {
		const adminPayload = { sub: '1', email: 'admin@b.com' };
		(jwt.verify as jest.Mock).mockImplementation(
			(_token: string, secret: string) => {
				if (secret !== USER_SECRET) return adminPayload;
				throw Object.assign(new Error(), { name: 'JsonWebTokenError' });
			},
		);

		const ctx = buildContext('Bearer token');
		guard.canActivate(ctx);
		const request = ctx.switchToHttp().getRequest();

		expect(request.user.role).toBe('admin');
	});
});
