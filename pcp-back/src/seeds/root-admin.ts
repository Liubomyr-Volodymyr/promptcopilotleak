import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { HASH_SALT } from '../common/constants';
import { Admin, AdminRole } from '../admin/entities/admin.entity';

export class RootAdminSeeder implements Seeder {
	public async run(dataSource: DataSource): Promise<void> {
		const repo = dataSource.getRepository(Admin);

		const rootAdmin: Partial<Admin> = {
			email: 'root@admin.com',
			firstName: 'Root',
			lastName: 'Admin',
			role: AdminRole.SuperAdmin,
			password: await bcrypt.hash(
				process.env.ROOT_ADMIN_PASSWORD,
				HASH_SALT,
			),
		};

		await repo.upsert(rootAdmin, ['email']);
		console.log('Root SuperAdmin seeded');
	}
}
