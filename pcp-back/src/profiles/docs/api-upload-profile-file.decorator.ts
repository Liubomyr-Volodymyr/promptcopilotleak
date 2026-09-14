import { applyDecorators } from '@nestjs/common';
import {
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiResponse,
} from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '../../common/decorators/api-unauthorized-response.decorator';

export function ApiUploadProfileFile() {
	return applyDecorators(
		ApiOperation({
			summary:
				'Upload a profile file (CV/structured data) and extract a structured profile for prompt generation',
			description:
				'Accepts PDF, DOCX, or CSV. Automatically detects file type and extracts role/stack/experience and other fields.',
		}),
		ApiConsumes('multipart/form-data'),
		ApiBody({
			description: 'Upload a single file in PDF/DOCX/CSV',
			schema: {
				type: 'object',
				properties: {
					file: {
						type: 'string',
						format: 'binary',
						description: 'The CV/profile document (PDF/DOCX/CSV)',
					},
					profileId: {
						type: 'integer',
						description: 'ID of the related profile',
						example: 123,
					},
				},
				required: ['file', 'profileId'],
			},
		}),
		ApiResponse({
			status: 201,
			description:
				'The file was parsed successfully and a profile was extracted',
			schema: {
				example: {
					ok: true,
					detectedType: 'pdf',
					profile: {
						role: 'Full-Stack Developer',
						stack: ['NestJS', 'React', 'TypeScript'],
						experienceYears: 4,
						domain: 'FinTech',
						tools: ['Docker', 'AWS'],
						links: ['https://github.com/example'],
						summary:
							'Full-stack engineer experienced in building Chrome extensions and NestJS backends.',
					},
					createFile: {
						id: 1,
						fileName: 'example.pdf',
						description: 'Parsed summary...',
						profileId: 123,
					},
					rawTextPreview:
						'John Doe — Full-Stack Developer...\nExperience: NestJS, React, AWS...',
				},
			},
		}),
		ApiUnauthorizedResponse(),
		ApiResponse({
			status: 400,
			description:
				'Bad Request: file or profileId is missing or invalid (e.g., empty CSV)',
		}),
		ApiResponse({
			status: 413,
			description: 'Payload Too Large: file exceeds 8MB limit',
		}),
		ApiResponse({
			status: 415,
			description:
				'Unsupported Media Type: only PDF/DOCX/CSV are allowed',
		}),
	);
}
