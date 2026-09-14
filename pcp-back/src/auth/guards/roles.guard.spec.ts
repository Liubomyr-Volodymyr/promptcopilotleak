import {
	ExecutionContext,
	ForbiddenException,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const buildContext = (user: any, handler = {}, cls = {}): ExecutionContext =>
	({
		getHandler: () => handler,
		getClass: () => cls,
		switchToHttp: () => ({ getRequest: () => ({ user }) }),
	}) as unknown as ExecutionContext;

describe('RolesGuard', () => {
	let guard: RolesGuard;
	let reflector: jest.Mocked<Reflector>;

	beforeEach(() => {
		reflector = { getAllAndOverride: jest.fn() } as any;
		guard = new RolesGuard(reflector);
	});

	it('returns true when no roles are required', () => {
		reflector.getAllAndOverride.mockReturnValue(undefined);

		expect(guard.canActivate(buildContext({ role: 'user' }))).toBe(true);
	});

	it('returns true when user has a required role', () => {
		reflector.getAllAndOverride.mockReturnValue(['admin']);

		expect(guard.canActivate(buildContext({ role: 'admin' }))).toBe(true);
	});

	it('returns true when user has one of multiple required roles', () => {
		reflector.getAllAndOverride.mockReturnValue(['admin', 'moderator']);

		expect(guard.canActivate(buildContext({ role: ['moderator'] }))).toBe(
			true,
		);
	});

	it('throws ForbiddenException when user role does not match', () => {
		reflector.getAllAndOverride.mockReturnValue(['admin']);

		expect(() => guard.canActivate(buildContext({ role: 'user' }))).toThrow(
			ForbiddenException,
		);
	});

	it('throws UnauthorizedException when no user on request', () => {
		reflector.getAllAndOverride.mockReturnValue(['admin']);

		expect(() => guard.canActivate(buildContext(null))).toThrow(
			UnauthorizedException,
		);
	});

	it('throws ForbiddenException when user has no role property', () => {
		reflector.getAllAndOverride.mockReturnValue(['admin']);

		expect(() => guard.canActivate(buildContext({}))).toThrow(
			ForbiddenException,
		);
	});
});
