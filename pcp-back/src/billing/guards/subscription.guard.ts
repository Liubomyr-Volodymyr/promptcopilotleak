import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionRepository } from '../services/subscription.repository';
import { SubscriptionService } from '../services/subscription.service';
import { FreeTrialsService } from '../../free-trials/services/free-trials.service';
import {
	FREE_TRIALS_META,
	FreeTrialsMeta,
} from '../../free-trials/decorators/allow-free-trials.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
	constructor(
		private readonly store: SubscriptionRepository,
		private readonly subscriptionService: SubscriptionService,
		private readonly reflector: Reflector,
		private readonly trials: FreeTrialsService,
	) {}

	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const req = ctx.switchToHttp().getRequest<any>();
		const res = ctx.switchToHttp().getResponse<any>();

		const email: string | undefined = req.user?.email;
		const userId: string | undefined = req.user?.userId;
		if (!email || !userId) throw new UnauthorizedException('Unauthorized');

		const freeAccess = await this.store.isFreeAccess(userId);
		if (freeAccess) return true;

		const sub =
			await this.subscriptionService.findActiveSubscriptionByEmail(email);
		const nowTs = Date.now();
		const endTs = sub?.current_period_end
			? new Date(sub.current_period_end).getTime()
			: null;

		const isActive = !!sub && (!endTs || endTs > nowTs);

		if (isActive) {
			this.safeSetHeaders(res, {
				'X-Free-Trials-Limit': '0',
				'X-Free-Trials-Remaining': '0',
			});
			return true;
		}

		this.safeSetHeaders(res, {
			// 'X-Subscription-Status': isActive ? 'active' : 'inactive',
			'X-Free-Trials-Limit': isActive ? '0' : undefined,
			'X-Free-Trials-Remaining': isActive ? '0' : undefined,
		});

		const meta = this.reflector.getAllAndOverride<FreeTrialsMeta>(
			FREE_TRIALS_META,
			[ctx.getHandler(), ctx.getClass()],
		);

		if (!meta) {
			throw new ForbiddenException('Subscription required');
		}

		const { key, limit, windowSec } = meta;

		const { allowed, remaining } = await this.trials.consume(
			userId,
			key,
			limit,
			windowSec,
		);

		this.safeSetHeaders(res, {
			'X-Free-Trials-Limit': String(limit),
			'X-Free-Trials-Remaining': String(Math.max(0, remaining)),
		});

		if (!allowed) {
			throw new ForbiddenException(
				'Free trial limit reached. Subscription required',
			);
		}

		return true;
	}

	private safeSetHeaders(
		res: any,
		headers: Record<string, string | undefined>,
	) {
		if (!res?.setHeader) return;
		for (const [k, v] of Object.entries(headers)) {
			if (typeof v === 'undefined') continue;
			try {
				res.setHeader(k, v);
			} catch {}
		}
	}
}
