import { Injectable } from '@nestjs/common';
import { ErrorLogData } from '../dto/logger.dto';

@Injectable()
export class LoggerService {
	private maskSensitiveData(data: any): any {
		if (!data) return data;
		const maskedData = { ...data };

		const sensitiveFields = [
			'password',
			'token',
			'credit_card',
			'stripe_token',
		];

		for (const field of sensitiveFields) {
			if (field in maskedData) {
				maskedData[field] = '[MASKED]';
			}
		}

		return maskedData;
	}

	logError(error: ErrorLogData): void {
		if (this.shouldSkipLogging(error)) {
			return;
		}

		const maskedBody = this.maskSensitiveData(error.body);
		const maskedQuery = this.maskSensitiveData(error.query);

		console.error({
			statusCode: error.statusCode,
			path: error.path,
			method: error.method,
			...(Object.keys(maskedBody || {}).length > 0 && {
				body: maskedBody,
			}),
			...(Object.keys(maskedQuery || {}).length > 0 && {
				query: maskedQuery,
			}),
			body: error.body,
			message: error.message,
		});
	}

	private shouldSkipLogging(error: ErrorLogData): boolean {
		return error.body && 'triggerType' in error.body;
	}
}
