import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { WsExceptionFilter } from './common/filters/ws-exception.filter';
import { GlobalPipesConfig } from './common/pipes/global.pipe';
import { LoggerService } from './logger/services/logger.service';
import { CONFIG } from './config/enums';
import { PcpOAuthServerProvider } from './mcp/oauth/oauth-server-provider.service';

async function start() {
	const PORT = Number(process.env.APP_PORT) || 5000;
	const app = await NestFactory.create(AppModule, {
		snapshot: true,
		rawBody: true,
	});

	app.setGlobalPrefix('api');

	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');

	const dateVersion = `${day}-${month}-${year}`;
	const docVersion = `${process.env.NODE_ENV}-${dateVersion}`;

	const config = new DocumentBuilder()
		.setTitle('Prompt copilot API')
		.setDescription('A NestJS-based application prompt copilot docs')
		.setVersion(docVersion)
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				name: 'Authorization',
				description: 'Paste your access token here',
				in: 'header',
			},
			'access_token',
		)
		.addTag('Auth')
		.addTag('Users')
		.addTag('Mail')
		.build();

	const document = SwaggerModule.createDocument(app, config);

	SwaggerModule.setup('api', app, document, {
		customSiteTitle: 'PСP API Docs',
		swaggerOptions: {
			persistAuthorization: true,
		},
	});

	const logger = app.get(LoggerService);
	app.useGlobalFilters(
		new AllExceptionsFilter(logger),
		new WsExceptionFilter(),
	);
	app.useGlobalPipes(GlobalPipesConfig);

	const origins = [
		...(process.env.ALLOWED_ORIGINS?.split(',') ?? []),
		`chrome-extension://${process.env.EXTENSION_ID}`,
	];

	app.enableCors({
		origin: process.env.NODE_ENV === 'production' ? origins : true,
		methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
		allowedHeaders: [
			'Content-Type',
			'Accept',
			'Authorization',
			'X-Requested-With',
		],
		credentials: true,
	});

	const configService = app.get(ConfigService);
	const apiUrl = configService.getOrThrow<string>(CONFIG.API_URL);
	const oauthProvider = app.get(PcpOAuthServerProvider);

	app.use(
		mcpAuthRouter({
			provider: oauthProvider,
			issuerUrl: new URL(apiUrl),
			resourceServerUrl: new URL('/api/mcp', apiUrl),
			scopesSupported: ['mcp'],
		}),
	);

	await app.listen(PORT, () =>
		console.info('\x1b[34m%s\x1b[0m', `Server started on port = ${PORT}`),
	);
}
void start();
