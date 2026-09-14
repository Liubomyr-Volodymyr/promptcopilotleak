import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminUsersService } from './services/admin-users.service';
import { Contact } from '../../../contacts/entities/contact.entity';
import { BillingModule } from '../../../billing/billing.module';

@Module({
	imports: [TypeOrmModule.forFeature([Contact]), BillingModule],
	controllers: [AdminUsersController],
	providers: [AdminUsersService],
	exports: [AdminUsersService],
})
export class AdminUsersModule {}
