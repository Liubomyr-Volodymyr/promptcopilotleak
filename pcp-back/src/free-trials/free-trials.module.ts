import { Module } from '@nestjs/common';
import { FreeTrialsService } from './services/free-trials.service';
import { RedisModule } from '../redis/redis.module';

@Module({
	imports: [RedisModule],
	providers: [
		{
			provide: FreeTrialsService,
			useClass: FreeTrialsService,
		},
	],
	exports: [FreeTrialsService],
})
export class FreeTrialsModule {}
