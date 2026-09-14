import {
	BadRequestException,
	Controller,
	Headers,
	HttpCode,
	Post,
	RawBodyRequest,
	Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StripeWebhookService } from '../services/stripe-webhook.service';

@ApiTags('Billing')
@Controller('billing/stripe')
export class StripeWebhookController {
	constructor(private service: StripeWebhookService) {}

	@Post('webhook')
	@HttpCode(200)
	async webhook(
		@Headers('stripe-signature') sig: string,
		@Req() req: RawBodyRequest<Request>,
	) {
		if (!sig)
			throw new BadRequestException('Missing stripe-signature header');

		return this.service.handle(sig, req.rawBody);
	}
}
