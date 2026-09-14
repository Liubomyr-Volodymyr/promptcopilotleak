import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AdminUsersService } from '../services/admin-users.service';
import { AdminJwtGuard } from '../../auth/guards/admin-jwt.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AdminRole } from '../../../entities/admin.entity';
import { CreateUserDto, QueryUsersDto, UpdateUserDto } from '../dto';
import { ApiAdminHardDeleteUser } from '../docs/api-admin-hard-delete-user.decorator';
import { ApiAdminDeleteUser } from '../docs/api-admin-delete-user.decorator';
import { ApiAdminGetUser } from '../docs/api-admin-get-user.decorator';
import { ApiAdminCreateUser } from '../docs/api-admin-create-user.decorator';
import { ApiAdminUpdateUser } from '../docs/api-admin-update-user.decorator';
import { ApiAdminRestoreUser } from '../docs/api-admin-restore-user.decorator';
import { ApiAdminListUsers } from '../docs/api-list-users.decorator';

@ApiTags('Admin Users')
@ApiBearerAuth('access_token')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.Admin, AdminRole.SuperAdmin)
@Controller()
export class AdminUsersController {
	constructor(private service: AdminUsersService) {}

	@Get()
	@ApiAdminListUsers()
	async list(@Query() q: QueryUsersDto) {
		return this.service.findAll(q);
	}

	@Get(':id')
	@ApiAdminGetUser()
	async get(@Param('id', ParseIntPipe) id: number) {
		return this.service.findOne(id);
	}

	@Post()
	@ApiAdminCreateUser()
	async create(@Body() dto: CreateUserDto) {
		return this.service.create(dto);
	}

	@Put(':id')
	@ApiAdminUpdateUser()
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateUserDto,
	) {
		return this.service.update(id, dto);
	}

	@Delete(':id')
	@ApiAdminDeleteUser()
	async softDelete(@Param('id', ParseIntPipe) id: number) {
		return this.service.softRemove(id);
	}

	@Post(':id/restore')
	@ApiAdminRestoreUser()
	async restore(@Param('id', ParseIntPipe) id: number) {
		return this.service.restore(id);
	}

	@Delete(':id/hard')
	@ApiAdminHardDeleteUser()
	async hardDelete(@Param('id', ParseIntPipe) id: number) {
		return this.service.hardDelete(id);
	}
}
