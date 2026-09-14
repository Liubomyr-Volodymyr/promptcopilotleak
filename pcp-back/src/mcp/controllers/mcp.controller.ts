import {
	All,
	Controller,
	HttpCode,
	HttpStatus,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpService } from '../mcp.service';
import { MCPDocDecorator } from '../docs/mcp-doc.decorator';
import { McpAuthGuard } from '../oauth/guards/mcp-auth.guard';

@ApiTags('MCP')
@UseGuards(McpAuthGuard)
@Controller('mcp')
export class McpController {
	constructor(private readonly mcpService: McpService) {}

	@All()
	@HttpCode(HttpStatus.OK)
	@MCPDocDecorator()
	async handle(@Req() req: any, @Res() res: any) {
		const server = this.mcpService.createServer(req.user);

		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});

		await server.connect(transport);
		await transport.handleRequest(req, res, req.body);
	}
}
