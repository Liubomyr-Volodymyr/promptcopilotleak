import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreeAccess } from '../../../contacts/entities/free-access.entity';
import { AccessManagementController } from './access-management.controller';
import { AccessManagementService } from './services/access-managenemt.service';

@Module({
	imports: [TypeOrmModule.forFeature([FreeAccess])],
	controllers: [AccessManagementController],
	providers: [AccessManagementService],
})
export class AccessManagementModule {}
