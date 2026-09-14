import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service';
import { SearchMemoryInput } from '../providers/interfaces';

@Injectable()
export class MemoryCacheService {
	private readonly prefix = 'memory';

	constructor(private readonly redis: RedisService) {}

	buildKey(input: SearchMemoryInput): string {
		return [
			this.prefix,
			input.userId,
			input.profileId ?? 'main',
			input.query,
			input.limit ?? 10,
		].join(':');
	}

	get(key: string) {
		return this.redis.get(key);
	}

	set(key: string, value: string, ttl = 60) {
		return this.redis.set(key, value, ttl);
	}
}
