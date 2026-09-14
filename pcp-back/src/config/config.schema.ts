import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
	NODE_ENV: Joi.string()
		.valid('local', 'development', 'production')
		.default('local'),

	APP_TITLE: Joi.string().optional(),
	APP_PORT: Joi.number().default(4000),
	CONTACT_EMAIL: Joi.string().email().optional(),

	API_KEY: Joi.string().optional(),

	POSTGRES_HOST: Joi.string().default('localhost'),
	POSTGRES_PORT: Joi.number().min(1).max(65535).default(5433),
	POSTGRES_USER: Joi.string().required(),
	POSTGRES_PASSWORD: Joi.string().required(),
	POSTGRES_DB: Joi.string().required(),

	POSTMARK_API_KEY: Joi.string().required(),

	JWT_SECRET: Joi.string().required(),
	JWT_EXPIRES_IN: Joi.string().default('3d'),
	JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

	API_URL: Joi.string().uri().required(),
	MCP_ACCESS_TOKEN_TTL: Joi.string().default('1h'),
	MCP_REFRESH_TOKEN_TTL: Joi.string().default('30d'),

	ROOT_ADMIN_PASSWORD: Joi.string(),

	EMAIL_FROM_NAME: Joi.string().required(),

	INFO_EMAIL: Joi.string().email().required(),
	SUPPORT_EMAIL: Joi.string().email().required(),

	REDIS_HOST: Joi.string().required(),
	REDIS_PORT: Joi.number().default(6380),

	OPENAI_CUSTOM_API_KEY: Joi.string().optional(),
	OPENAI_INTERNAL_API_KEY: Joi.string().optional(),
	OPENAI_CONTEXT_API_KEY: Joi.string().optional(),
	ANTHROPIC_API_KEY: Joi.string().optional(),
	GEMINI_API_KEY: Joi.string().optional(),
	GROQ_API_KEY: Joi.string()
		.pattern(/^gsk_.+$/, 'Groq API key')
		.optional()
		.messages({
			'string.pattern.base': 'GROQ_API_KEY must start with "gsk_"',
		}),
	OPENROUTER_API_KEY: Joi.string()
		.pattern(/^sk-.+$/, 'API key')
		.optional()
		.messages({
			'string.pattern.base': 'OPENROUTER_API_KEY must start with "sk-"',
		}),

	APIFY_TOKEN: Joi.string().required(),

	GOOGLE_CLIENT_ID: Joi.string().required(),
	GOOGLE_CLIENT_SECRET: Joi.string().required(),
	GOOGLE_CALLBACK_URL: Joi.string().uri().required(),

	STRIPE_SECRET_KEY: Joi.string().optional(),
	STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
	STRIPE_PRODUCT_ID: Joi.string().optional(),
	STRIPE_SUCCESS_URL: Joi.string().uri().optional(),
	STRIPE_CANCEL_URL: Joi.string().uri().optional(),

	MINIO_HOST: Joi.string().required(),
	MINIO_PORT: Joi.string().required(),
	MINIO_USER: Joi.string().optional(),
	MINIO_PASS: Joi.string().optional(),
	MINIO_BUCKET: Joi.string().required(),

	URL_SITE_MAIN: Joi.string().uri().optional(),

	EXTENSION_FRONTEND_URL: Joi.string().uri().optional(),

	CRYPTO_SECRET: Joi.string(),

	ADMIN_JWT_SECRET: Joi.string().required(),
	ADMIN_JWT_EXPIRES_IN: Joi.string().required(),

	MIDBRAIN_API_URL: Joi.string().uri().required(),
	MIDBRAIN_API_KEY: Joi.string().required(),
});
