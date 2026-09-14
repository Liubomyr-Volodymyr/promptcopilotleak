import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

const mockConfigService = {
	get: jest.fn().mockReturnValue('test-secret'),
};

describe('JwtStrategy', () => {
	let strategy: JwtStrategy;

	beforeEach(() => {
		strategy = new JwtStrategy(mockConfigService as any);
	});

	describe('validate', () => {
		it('returns user object when payload is valid', async () => {
			const payload = { sub: 42, email: 'a@b.com' };

			const result = await strategy.validate(payload);

			expect(result).toEqual({ userId: 42, email: 'a@b.com' });
		});

		it('throws UnauthorizedException when payload is null', async () => {
			await expect(strategy.validate(null)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('throws UnauthorizedException when sub is missing', async () => {
			await expect(
				strategy.validate({ email: 'a@b.com' }),
			).rejects.toThrow(UnauthorizedException);
		});
	});
});
