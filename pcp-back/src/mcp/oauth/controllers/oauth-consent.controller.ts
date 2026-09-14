import {
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards';
import { ConsentDto } from '../dto/consent.dto';
import { OAuthClientsStoreService } from '../oauth-clients-store.service';
import { PcpOAuthServerProvider } from '../oauth-server-provider.service';

@ApiTags('MCP OAuth')
@UseGuards(JwtAuthGuard)
@Controller('mcp/oauth')
export class OAuthConsentController {
	constructor(
		private readonly provider: PcpOAuthServerProvider,
		private readonly clientsStore: OAuthClientsStoreService,
	) {}

	@Get('consent/:requestId')
	async getConsent(@Param('requestId') requestId: string) {
		const pending = await this.provider.getPendingRequest(requestId);
		if (!pending) {
			throw new NotFoundException(
				'Authorization request not found or expired',
			);
		}

		const client = await this.clientsStore.getClient(pending.clientId);

		return {
			clientName: client?.client_name ?? pending.clientId,
			scopes: pending.scopes ?? [],
		};
	}

	@Post('consent')
	async consent(@Body() dto: ConsentDto, @Req() req: any) {
		const redirectTo = await this.provider.completeAuthorization(
			dto.requestId,
			{ userId: req.user.userId, email: req.user.email },
			dto.approve,
		);

		return { redirectTo };
	}
}
