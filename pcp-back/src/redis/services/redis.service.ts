import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../common/constants';

@Injectable()
export class RedisService {
	constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
		redis.on('error', (err) => console.error('Redis Client Error'));
	}

	async get(key: string): Promise<string | null> {
		return this.redis.get(key);
	}

	async set(key: string, value: string, ttl?: number): Promise<void> {
		if (ttl) {
			await this.redis.set(key, value, 'EX', ttl);
		} else {
			await this.redis.set(key, value);
		}
	}
	incr(key: string): Promise<number> {
		return this.redis.incr(key);
	}
	expire(key: string, ttlSec: number): Promise<number> {
		return this.redis.expire(key, ttlSec);
	}
	del(key: string): Promise<number> {
		return this.redis.del(key);
	}
	async getDel(key: string): Promise<string | null> {
		const script = `
      local v = redis.call('GET', KEYS[1])
      if v then redis.call('DEL', KEYS[1]) end
      return v
    `;
		const res = await this.redis.eval(script, 1, key);
		return res as string | null;
	}

	async incrWithTtlIfNew(key: string, ttlSec: number): Promise<number> {
		const script = `
      local c = redis.call('INCR', KEYS[1])
      if c == 1 then
        redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
      end
      return c
    `;
		const res = await this.redis.eval(script, 1, key, String(ttlSec));
		return Number(res);
	}
}
