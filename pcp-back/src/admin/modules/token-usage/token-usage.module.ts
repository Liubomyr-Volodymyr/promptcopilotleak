import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenUsage } from '../../../token-tracker/entities/token-usage.entity';
import { AdminTokenUsageController } from './controllers/admin-token-usage.controller';
import { AdminTokenUsageService } from './services/admin-token-usage.service';

@Module({
	imports: [TypeOrmModule.forFeature([TokenUsage])],
	controllers: [AdminTokenUsageController],
	providers: [AdminTokenUsageService],
	exports: [AdminTokenUsageService],
})
export class AdminTokenUsageModule {}
