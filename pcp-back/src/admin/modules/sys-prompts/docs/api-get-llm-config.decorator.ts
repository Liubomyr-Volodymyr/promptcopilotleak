import { applyDecorators } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiOperation,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiGetLlmConfig() {
	return applyDecorators(
		ApiOperation({ summary: 'Get LLM config by key' }),
		ApiUnauthorizedResponse(),
		ApiBadRequestResponse({ description: 'Invalid key' }),
	);
}
