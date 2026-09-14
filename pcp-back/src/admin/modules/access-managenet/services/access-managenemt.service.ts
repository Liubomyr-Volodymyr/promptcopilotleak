import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreeAccess } from '../../../../contacts/entities/free-access.entity';

@Injectable()
export class AccessManagementService {
	constructor(
		@InjectRepository(FreeAccess)
		private readonly accessRepo: Repository<FreeAccess>,
	) {}

	async grantPermission(userId: string) {
		const existing = await this.accessRepo.findOne({ where: { userId } });

		if (existing) {
			return existing;
		}

		const newAccess = this.accessRepo.create({ userId, permanent: true });
		return this.accessRepo.save(newAccess);
	}

	async revokeById(id: string) {
		const existing = await this.accessRepo.findOne({ where: { id } });
		if (!existing) return { message: 'No access found' };
		await this.accessRepo.delete({ id });
		return { message: 'Access revoked' };
	}

	async hasFreeAccess(userId: string) {
		const existing = await this.accessRepo.findOne({ where: { userId } });
		return !!existing;
	}

	async findAll() {
		return this.accessRepo.find({ relations: ['user'] });
	}
}
