import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
	CreateSubscriptionCheckoutDto,
	SubscriptionInfoDto,
	UrlDto,
} from '../dto/subscription.dto';
import { JwtAuthGuard } from '../../auth/guards';
import { SubscriptionService } from '../services/subscription.service';
import { ApiBillingCheckoutDocs } from '../docs/api-billing-checkout.decorator';
import { ApiBillingMeSubscriptionDocs } from '../docs/api-billing-me.decorator';
import { ApiBillingPortalDocs } from '../docs/api-billing-portal.decorator';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
	constructor(private service: SubscriptionService) {}

	@Post('checkout')
	@ApiBillingCheckoutDocs()
	async createCheckout(
		@Body() dto: CreateSubscriptionCheckoutDto,
		@Req() req: Request,
	): Promise<UrlDto> {
		dto.email = req.user.email;
		dto.user_id = req.user.userId;
		return this.service.createCheckoutSession(dto);
	}

	@Post('portal')
	@ApiBillingPortalDocs()
	async createPortal(@Req() req: Request): Promise<UrlDto> {
		return this.service.createPortalSession(req.user.email);
	}

	@Get('me/subscription')
	@ApiBillingMeSubscriptionDocs()
	async me(@Req() req: Request): Promise<SubscriptionInfoDto> {
		return this.service.getMySubscription(req.user.email);
	}
}
