import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
	requestId: string;
	userId?: string;
}

@Injectable()
export class RequestContextStore {
	private readonly asyncLocalStorage =
		new AsyncLocalStorage<RequestContext>();

	run(context: RequestContext, callback: (...args: any[]) => void) {
		this.asyncLocalStorage.run(context, callback);
	}

	get<T extends keyof RequestContext>(key: T): RequestContext[T] | undefined {
		const store = this.asyncLocalStorage.getStore();
		return store?.[key];
	}

	set<T extends keyof RequestContext>(key: T, value: RequestContext[T]) {
		const store = this.asyncLocalStorage.getStore();
		if (store) store[key] = value;
	}
}
