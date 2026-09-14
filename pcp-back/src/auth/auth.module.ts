import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { ContactsModule } from '../contacts/contacts.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailModule } from '../mail/mail.module';
import { AnyJwtAuthGuard } from './guards/any-jwt.guard';

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.register({
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
		}),
		HttpModule,
		MailModule,
		ContactsModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, GoogleStrategy, AnyJwtAuthGuard],
	exports: [PassportModule, JwtModule, AnyJwtAuthGuard],
})
export class AuthModule {}
