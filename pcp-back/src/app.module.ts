import { Module } from '@nestjs/common';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { ProfilesModule } from './profiles/profiles.module';
import { FeaturesModule } from './features/features.module';
import { configValidationSchema } from './config/config.schema';
import { FileModule } from './file/file.module';
import { BillingModule } from './billing/billing.module';
import { FreeTrialsModule } from './free-trials/free-trials.module';
import { CONFIG } from './config/enums';
import { MinioModule } from './minio/minio.module';
import { RedisModule } from './redis/redis.module';
import { TokenTrackerModule } from './token-tracker/token-tracker.module';
import { StoreModule } from './store/store.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserContextInterceptor } from './common/interceptors';
import { CryptoModule } from './crypto/crypto.module';
import { AdminModule } from './admin/admin.module';
import { ServerInfoController } from './common/controllers/server-info.controller';
import { MemoryModule } from './memory/memory.module';
import { McpModule } from './mcp/mcp.module';

@Module({
	imports: [
		DevtoolsModule.register({
			http: process.env.NODE_ENV !== 'production',
			port: 8000,
		}),
		BullModule.forRoot({
			redis: {
				host: process.env.REDIS_HOST || 'redis',
				port: 6379,
				username: process.env.REDIS_USER,
				password: process.env.REDIS_PASSWORD,
				family: 0,
			},
		}),
		ThrottlerModule.forRoot({
			throttlers: [
				{
					name: 'default',
					ttl: 60000,
					limit: 10,
				},
				{
					name: 'minute',
					ttl: 60000,
					limit: 30,
				},
				{
					name: 'hour',
					ttl: 3600000,
					limit: 200,
				},
				{
					name: 'day',
					ttl: 86400000,
					limit: 2000,
				},
			],
		}),
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: configValidationSchema,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				type: 'postgres',
				host: config.get<string>(CONFIG.POSTGRES_HOST),
				port: +config.get<number>(CONFIG.POSTGRES_PORT, 5433),
				username: config.get<string>(CONFIG.POSTGRES_USER),
				password: config.get<string>(CONFIG.POSTGRES_PASSWORD),
				database: config.get<string>(CONFIG.POSTGRES_DB),
				entities: [__dirname + '/**/*.entity{.ts,.js}'],
				migrations: [__dirname + '/migrations/*{.ts,.js}'],
				autoLoadEntities: false,
				synchronize: false,
			}),
		}),
		StoreModule,
		LoggerModule,
		McpModule,
		MemoryModule,
		MinioModule,
		AuthModule,
		ContactsModule,
		ProfilesModule,
		TokenTrackerModule,
		FeaturesModule,
		FileModule,
		BillingModule,
		FreeTrialsModule,
		RedisModule,
		CryptoModule,
		AdminModule,
	],
	controllers: [ServerInfoController],
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: UserContextInterceptor,
		},
	],
})
export class AppModule {}
