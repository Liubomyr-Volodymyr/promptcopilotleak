import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MemoryModule } from '../memory/memory.module';
import { McpController } from './controllers/mcp.controller';
import { McpService } from './mcp.service';
import { FeaturesModule } from '../features/features.module';
import { AuthModule } from '../auth/auth.module';
import { OAuthClient } from './oauth/entities/oauth-client.entity';
import { OAuthClientsStoreService } from './oauth/oauth-clients-store.service';
import { PcpOAuthServerProvider } from './oauth/oauth-server-provider.service';
import { McpAuthGuard } from './oauth/guards/mcp-auth.guard';
import { OAuthConsentController } from './oauth/controllers/oauth-consent.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([OAuthClient]),
		MemoryModule,
		FeaturesModule,
		AuthModule,
	],
	controllers: [McpController, OAuthConsentController],
	providers: [
		McpService,
		OAuthClientsStoreService,
		PcpOAuthServerProvider,
		McpAuthGuard,
	],
	exports: [PcpOAuthServerProvider],
})
export class McpModule {}
