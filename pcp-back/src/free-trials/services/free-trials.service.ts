import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service';

@Injectable()
export class FreeTrialsService {
	constructor(private readonly redis: RedisService) {}

	private key(userId: string, feature: string) {
		return `ft:${feature}:${userId}:${new Date().toISOString().slice(0, 10)}`; // YYYY-MM-DD
	}

	async consume(
		userId: string,
		feature: string,
		limit = 5,
		ttlSec = 86400,
	): Promise<{ allowed: boolean; used: number; remaining: number }> {
		const k = this.key(userId, feature);
		const used = await this.redis.incr(k);
		if (used === 1) await this.redis.expire(k, ttlSec);
		const allowed = used <= limit;
		const remaining = Math.max(0, limit - used);
		return { allowed, used, remaining };
	}
}
