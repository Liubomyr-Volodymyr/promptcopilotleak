import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { BillingController } from './controllers/billing.controller';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';

import { SubscriptionRepository } from './services/subscription.repository';
import { SubscriptionCustomerService } from './services/subscription-customer.service';
import { SubscriptionService } from './services/subscription.service';
import { StripeWebhookService } from './services/stripe-webhook.service';

import { SubscriptionGuard } from './guards/subscription.guard';
import { CONFIG } from '../config/enums';
import { STRIPE_CLIENT } from '../common/constants';
import { FreeTrialsModule } from '../free-trials/free-trials.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingCustomer } from './entities/billing-customer.entity';
import { BillingSubscription } from './entities/billing-subscriptions.entity';
import { SubscriptionPlans } from './entities/plan.entity';
import { SubscriptionPlanPrice } from './entities/subscription_plan_prices.entity';
import { FreeAccess } from '../contacts/entities/free-access.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			BillingCustomer,
			BillingSubscription,
			SubscriptionPlans,
			SubscriptionPlanPrice,
			FreeAccess,
		]),
		FreeTrialsModule,
	],
	controllers: [BillingController, StripeWebhookController],
	providers: [
		{
			provide: STRIPE_CLIENT,
			inject: [ConfigService],
			useFactory: (config: ConfigService) => {
				return new Stripe(config.get(CONFIG.STRIPE_SECRET_KEY), {
					apiVersion: '2024-12-18.acacia',
				});
			},
		},
		SubscriptionRepository,
		SubscriptionCustomerService,
		SubscriptionService,
		StripeWebhookService,
		SubscriptionGuard,
	],
	exports: [SubscriptionRepository, SubscriptionGuard, SubscriptionService],
})
export class BillingModule {}
