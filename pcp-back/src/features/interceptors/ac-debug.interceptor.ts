import {
	CallHandler,
	ExecutionContext,
	Injectable,
	Logger,
	NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LLModel } from '../../common/enums';
import { LLM_META_KEY } from '../../common/decorators/llm.decorator';

@Injectable()
export class ACDebugInterceptor implements NestInterceptor {
	private readonly logger = new Logger(ACDebugInterceptor.name);
	constructor(private readonly reflector: Reflector) {}

	intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
		if (typeof ctx.getType !== 'function' || ctx.getType() !== 'http') {
			return next.handle();
		}

		const http = ctx.switchToHttp?.();
		const req = http?.getRequest?.() ?? {};

		const email = req.user?.email ?? 'anonymous';
		const path =
			req.route?.path ??
			req.originalUrl ??
			req.url ??
			(typeof ctx.getClass === 'function'
				? ctx.getClass()?.name
				: 'unknown');

		const handler = ctx?.getHandler?.();
		const clazz = ctx?.getClass?.();
		const targets = [handler, clazz].filter(Boolean);

		const declaredModel = targets.length
			? this.reflector.getAllAndOverride<LLModel | string>(
					LLM_META_KEY,
					targets,
				)
			: undefined;

		const serviceModel: LLModel | string | undefined = req.llmModel;
		const modelStr = serviceModel ?? declaredModel ?? 'n/a';

		const start = Date.now();

		return next.handle().pipe(
			tap({
				next: () => {
					const took = Date.now() - start;
					this.logger.debug(
						`user=${email} path=${path} llm=${modelStr} took=${took}ms`,
					);
				},
				error: (err) => {
					const took = Date.now() - start;
					this.logger.error(
						`[ACDebug] user=${email} path=${path} llm=${modelStr} failed after ${took}ms: ${err?.message}`,
					);
				},
			}),
		);
	}
}
