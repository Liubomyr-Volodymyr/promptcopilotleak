import {
	Controller,
	UseGuards,
	Post,
	Body,
	Delete,
	Param,
	Get,
	ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminRole } from '../../entities/admin.entity';
import { AccessManagementService } from './services/access-managenemt.service';
import { CreateFreeAccessDto } from './dto/create-free-access.dto';

@ApiTags('Admin Free Access Management')
@ApiBearerAuth('access_token')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.Admin, AdminRole.SuperAdmin)
@Controller('free-access')
export class AccessManagementController {
	constructor(
		private readonly accessManagementService: AccessManagementService,
	) {}

	@Post()
	@ApiOperation({ summary: 'Grant permanent free access to a user' })
	grant(@Body() dto: CreateFreeAccessDto) {
		return this.accessManagementService.grantPermission(dto.userId);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Revoke free access by permission id' })
	revoke(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.accessManagementService.revokeById(id);
	}

	@Get(':userId')
	@ApiOperation({ summary: 'Check if user has free access' })
	check(@Param('userId', new ParseUUIDPipe()) userId: string) {
		return this.accessManagementService.hasFreeAccess(userId);
	}

	@Get()
	@ApiOperation({ summary: 'List all free access records' })
	list() {
		return this.accessManagementService.findAll();
	}
}
