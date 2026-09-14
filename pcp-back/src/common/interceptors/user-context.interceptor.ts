import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextStore } from '../../store/request-context.store';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
	constructor(private readonly ctxStore: RequestContextStore) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const req = context.switchToHttp().getRequest();
		if (req.user?.userId) {
			this.ctxStore.set('userId', req.user.userId);
		}
		return next.handle();
	}
}
