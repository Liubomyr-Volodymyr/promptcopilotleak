import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AdminAuthService } from './services/admin-auth.service';
import { Admin } from '../../entities/admin.entity';
import { AdminAuthController } from './admin-auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CONFIG } from '../../../config/enums';

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: 'admin-jwt' }),
		ConfigModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				secret: config.get<string>(CONFIG.ADMIN_JWT_SECRET),
				signOptions: {
					expiresIn: config.get<string>(CONFIG.ADMIN_JWT_EXPIRES_IN),
				},
			}),
		}),
		TypeOrmModule.forFeature([Admin]),
	],
	controllers: [AdminAuthController],
	providers: [AdminJwtStrategy, AdminAuthService],
	exports: [AdminAuthService],
})
export class AdminAuthModule {}
