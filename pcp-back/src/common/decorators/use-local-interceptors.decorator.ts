import { UseInterceptors, applyDecorators } from '@nestjs/common';

export function UseLocalInterceptors(...interceptors: any[]) {
	if (process.env.NODE_ENV === 'local') {
		return applyDecorators(UseInterceptors(...interceptors));
	}

	return () => {};
}
