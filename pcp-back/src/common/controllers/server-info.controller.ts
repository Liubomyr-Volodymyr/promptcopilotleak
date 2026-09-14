import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export class ServerInfoDto {
	environment: string;
}

@ApiTags('Server')
@Controller('server')
export class ServerInfoController {
	@Get('info')
	@ApiOperation({ summary: 'Get server environment information' })
	@ApiResponse({
		status: 200,
		description: 'Server environment information',
		schema: {
			type: 'object',
			properties: {
				environment: {
					type: 'string',
					example: 'development',
					description: 'Current NODE_ENV value',
				},
			},
		},
	})
	getServerInfo(): ServerInfoDto {
		return {
			environment: process.env.NODE_ENV || 'development',
		};
	}
}
