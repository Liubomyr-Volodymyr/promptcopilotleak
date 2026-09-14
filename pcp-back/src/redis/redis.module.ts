import { Global, Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { REDIS_CLIENT } from '../common/constants';
import { BullModule, getQueueToken } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { Redis } from 'ioredis';

export const CACHE_QUEUE = 'cache';

@Global()
@Module({
	imports: [BullModule.registerQueue({ name: CACHE_QUEUE })],
	providers: [
		{
			provide: REDIS_CLIENT,
			inject: [getQueueToken(CACHE_QUEUE)],
			useFactory: async (queue: Queue): Promise<Redis> => {
				await queue.isReady();
				return queue.client;
			},
		},
		RedisService,
	],
	exports: [REDIS_CLIENT, BullModule, RedisService],
})
export class RedisModule {}
