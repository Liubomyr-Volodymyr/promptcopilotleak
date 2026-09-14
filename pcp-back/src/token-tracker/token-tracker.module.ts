import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenTrackerService } from './services/token-tracker.service';
import { TokenCounterService } from './services/token-counter.service';
import { TokenUsage } from './entities/token-usage.entity';

@Module({
	imports: [TypeOrmModule.forFeature([TokenUsage])],
	providers: [TokenTrackerService, TokenCounterService],
	exports: [TokenTrackerService, TokenCounterService],
})
export class TokenTrackerModule {}
