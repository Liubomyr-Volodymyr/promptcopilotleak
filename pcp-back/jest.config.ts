import type { Config } from 'jest';

const config: Config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleFileExtensions: ['ts', 'js', 'json'],

	rootDir: '.',
	testMatch: ['**/*.spec.ts'],

	transform: {
		'^.+\\.ts$': 'ts-jest',
	},

	moduleNameMapper: {
		'^src/(.*)$': '<rootDir>/src/$1',
	},

	clearMocks: true,
};

export default config;
