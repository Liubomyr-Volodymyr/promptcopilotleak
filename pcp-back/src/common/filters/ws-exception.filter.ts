import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
	catch(exception: WsException, host: ArgumentsHost) {
		const ctx = host.switchToWs();
		const client: Socket = ctx.getClient();

		const error = exception.getError();
		const message =
			typeof error === 'string'
				? error
				: (error as any)?.message || 'Unknown error';

		client.emit('autocomplete_error', {
			error: message,
		});
	}
}
