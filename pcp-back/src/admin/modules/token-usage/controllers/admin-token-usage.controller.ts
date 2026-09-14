import {
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../../auth/guards/admin-jwt.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AdminTokenUsageService } from '../services/admin-token-usage.service';
import { QueryTokenUsageDto } from '../dto/query-token-usage.dto';
import { AdminRole } from '../../../entities/admin.entity';
import { ApiAdminTokenUsageStats } from '../docs/api-admin-token-usage-stats';
import { ApiAdminTokenUsageList } from '../docs/api-admin-token-usage-list';
import { ApiGetTokenUsageById } from '../docs/api-get-token-usage-by-id';
import { ApiDeleteTokenUsage } from '../docs/api-delete-token-usage';

@ApiTags('Admin Token Usage')
@ApiBearerAuth('access_token')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.Admin, AdminRole.SuperAdmin)
@Controller('token-usage')
export class AdminTokenUsageController {
	constructor(private readonly service: AdminTokenUsageService) {}

	@Get()
	@ApiAdminTokenUsageList()
	async list(@Query() q: QueryTokenUsageDto) {
		return this.service.findAll(q);
	}

	@Get('stats')
	@ApiAdminTokenUsageStats()
	async stats(@Query() q: QueryTokenUsageDto) {
		q.groupBy = 'user';
		q.page = 1;
		q.limit = 0;
		return this.service.findAll(q);
	}

	@Get(':id')
	@ApiGetTokenUsageById()
	async get(@Param('id', ParseIntPipe) id: number) {
		return this.service.findOne(id);
	}

	@Delete(':id')
	@ApiDeleteTokenUsage()
	async remove(@Param('id', ParseIntPipe) id: number) {
		return this.service.delete(id);
	}
}
