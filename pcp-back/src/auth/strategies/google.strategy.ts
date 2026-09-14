import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service';
import { CONFIG } from '../../config/enums';
import type { Contact } from '../../contacts/entities/contact.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google-web') {
	constructor(
		private readonly configService: ConfigService,
		private readonly authService: AuthService,
	) {
		super({
			clientID: configService.get<string>(CONFIG.GOOGLE_CLIENT_ID),
			clientSecret: configService.get<string>(
				CONFIG.GOOGLE_CLIENT_SECRET,
			),
			callbackURL: configService.get<string>(CONFIG.GOOGLE_CALLBACK_URL),
			scope: ['email', 'profile'],
		});
	}

	authorizationParams(): Record<string, string> {
		return {
			prompt: 'select_account',
		};
	}

	async validate(
		_accessToken: string,
		_refreshToken: string,
		profile: any,
	): Promise<Contact> {
		const { emails, name, photos } = profile;
		if (!emails?.[0]?.value)
			throw new Error('No email found in Google profile');
		const avatarUrl = photos?.[0]?.value ?? null;

		return this.authService.validateGoogleUser({
			email: emails[0].value,
			firstName: name?.givenName,
			lastName: name?.familyName,
			avatarUrl,
		});
	}
}
