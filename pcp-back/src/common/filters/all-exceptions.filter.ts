import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
	Injectable,
} from '@nestjs/common';
import { LoggerService } from '../../logger/services/logger.service';

interface HttpExceptionResponse {
	message?: string | string[];
	error?: string;
	statusCode?: number;
	[key: string]: any;
}

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	constructor(private readonly loggerService: LoggerService) {}

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Internal Server Error';
		let errors: string[] = [];

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse =
				exception.getResponse() as HttpExceptionResponse;

			const responseMessage =
				typeof exceptionResponse === 'object'
					? exceptionResponse.message || exceptionResponse.error
					: exceptionResponse;

			message = Array.isArray(responseMessage)
				? responseMessage.join('; ')
				: String(responseMessage);

			errors = Array.isArray(responseMessage)
				? responseMessage
				: [message];
		} else if (exception instanceof Error) {
			message = exception.message;
			errors = [message];
		}

		// console.log('request', request);
		this.loggerService.logError({
			statusCode: status,
			path: request.url,
			method: request.method,
			body: request.body,
			query: request.query,
			message: message,
		});

		response.status(status).json({
			success: false,
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			message: message,
			errors: errors,
		});
	}
}
