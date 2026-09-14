import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const MCPDocDecorator = () => {
	return applyDecorators(
		ApiOperation({
			summary: 'MCP endpoint',
			description:
				'Endpoint for Model Context Protocol clients. Requires an OAuth access token issued by this server (see /.well-known/oauth-protected-resource/api/mcp). Supports GET, POST and other MCP transport requests.',
		}),
		ApiResponse({
			status: 200,
			description: 'MCP request processed successfully.',
		}),
		ApiResponse({
			status: 401,
			description: 'Missing, invalid, or expired access token.',
		}),
	);
};
