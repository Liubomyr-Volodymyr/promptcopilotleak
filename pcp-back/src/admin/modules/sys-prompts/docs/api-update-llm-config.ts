import { applyDecorators } from '@nestjs/common';
import {
	ApiOperation,
	ApiResponse,
	ApiBadRequestResponse,
	ApiBody,
} from '@nestjs/swagger';
import { CreateLlmConfigDto } from '../dto/create-llm-config.dto';

export function ApiUpdateLlmConfig() {
	return applyDecorators(
		ApiOperation({ summary: 'Create or update a LLM config by key' }),
		ApiResponse({
			status: 200,
			description: 'LLM config updated successfully',
		}),
		ApiBadRequestResponse({ description: 'Validation failed' }),
		ApiBody({
			type: CreateLlmConfigDto,
			examples: {
				example: {
					value: {
						key: 'autocomplete',
						model: 'groq-oss',
						defaults: {
							temperature: 0.2,
							topP: 1,
						},
					},
				},
			},
		}),
	);
}
