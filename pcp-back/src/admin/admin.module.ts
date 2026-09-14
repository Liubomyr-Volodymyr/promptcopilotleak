import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AdminAuthModule } from './modules/auth/admin-auth.module';
import { AdminUsersModule } from './modules/users/users.module';
import { AdminTokenUsageModule } from './modules/token-usage/token-usage.module';
import { AccessManagementModule } from './modules/access-managenet/access-managenemt.module';
import { SysPromptModule } from './modules/sys-prompts/sys-prompts.module';

@Module({
	imports: [
		AdminAuthModule,
		AdminUsersModule,
		AdminTokenUsageModule,
		AccessManagementModule,
		SysPromptModule,
		RouterModule.register([
			{ path: 'admin/auth', module: AdminAuthModule },
			{ path: 'admin/users', module: AdminUsersModule },
			{ path: 'admin/activity', module: AdminTokenUsageModule },
			{ path: 'admin/manage-access', module: AccessManagementModule },
			{ path: 'admin/manage-prompts', module: SysPromptModule },
		]),
	],
})
export class AdminModule {}
