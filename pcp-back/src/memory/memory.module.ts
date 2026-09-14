import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MidbrainClient } from './providers/midbrain/midbrain.client';
import { MidbrainProvider } from './providers/midbrain/midbrain.provider';
import { MEMORY_PROVIDER } from '../common/constants';
import { MemoryCacheService } from './services/memory-cache.service';
import { MemoryRankingService } from './services/memory-ranking.service';
import { MemoryRetrievalService } from './services/memory-retrieval.service';
import { MemoryAgentService } from './services/memory-agent.service';
import { MemoryAgent } from './entities/memory-agent.entity';
import { CryptoModule } from '../crypto/crypto.module';
import { MemoryConsolidateService } from './services/memory-consolidate.service';
import { MemoryController } from './memory.controller';
import { AIModule } from '../ai/ai.module';

@Module({
	imports: [TypeOrmModule.forFeature([MemoryAgent]), AIModule, CryptoModule],
	controllers: [MemoryController],
	providers: [
		MidbrainClient,
		{
			provide: MEMORY_PROVIDER,
			useClass: MidbrainProvider,
		},
		{
			provide: MidbrainProvider,
			useExisting: MEMORY_PROVIDER,
		},
		MemoryCacheService,
		MemoryRankingService,
		MemoryRetrievalService,
		MemoryAgentService,
		MemoryConsolidateService,
	],
	exports: [MEMORY_PROVIDER, MemoryRetrievalService, MemoryAgentService, MidbrainProvider],
})
export class MemoryModule {}
