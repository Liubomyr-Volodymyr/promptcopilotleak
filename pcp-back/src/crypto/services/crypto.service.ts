import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { CONFIG } from '../../config/enums';

@Injectable()
export class CryptoService {
	private readonly algorithm = 'aes-256-gcm';
	private readonly secret: Buffer;

	constructor(private readonly configService: ConfigService) {
		const secret = this.configService.get<string>(CONFIG.CRYPTO_SECRET);
		if (!secret) {
			throw new Error('CRYPTO_SECRET is not defined');
		}
		this.secret = crypto.createHash('sha256').update(secret).digest();
	}

	/**
	 * Encrypts a string using aes-256-gcm algorithm.
	 * @param value The string to encrypt.
	 * @returns The base64 encoded encrypted string.
	 */
	encrypt(value: string): string {
		const iv = crypto.randomBytes(12);
		const cipher = crypto.createCipheriv(this.algorithm, this.secret, iv);

		const encrypted = Buffer.concat([
			cipher.update(value, 'utf8'),
			cipher.final(),
		]);
		const authTag = cipher.getAuthTag();

		return Buffer.concat([iv, authTag, encrypted]).toString('base64');
	}

	/**
	 * Decrypts a base64 encoded string.
	 * @param encryptedBase64 The base64 encoded string to decrypt.
	 * @returns The original decrypted string.
	 */
	decrypt(encryptedBase64: string): string {
		const buffer = Buffer.from(encryptedBase64, 'base64');
		const iv = buffer.subarray(0, 12);
		const authTag = buffer.subarray(12, 28);
		const encrypted = buffer.subarray(28);

		const decipher = crypto.createDecipheriv(
			this.algorithm,
			this.secret,
			iv,
		);
		decipher.setAuthTag(authTag);

		const decrypted = Buffer.concat([
			decipher.update(encrypted),
			decipher.final(),
		]);

		return decrypted.toString('utf8');
	}
}
