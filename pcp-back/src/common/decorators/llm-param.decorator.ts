import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import 'reflect-metadata';
import { LLModel } from '../enums';
import { LLM_META_KEY } from './llm.decorator';

export const LlmModel = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): LLModel | undefined => {
		const handler = ctx.getHandler?.();
		const clazz = ctx.getClass?.();

		const fromHandler = handler
			? Reflect.getMetadata(LLM_META_KEY, handler)
			: undefined;
		const fromClass = clazz
			? Reflect.getMetadata(LLM_META_KEY, clazz)
			: undefined;

		return (fromHandler ?? fromClass) as LLModel | undefined;
	},
);
