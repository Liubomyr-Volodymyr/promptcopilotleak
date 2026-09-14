import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../../../entities/admin.entity';
import { AdminLoginDto } from '../dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
	constructor(
		@InjectRepository(Admin) private repo: Repository<Admin>,
		private jwt: JwtService,
	) {}

	async validateCredentials(email: string, pass: string) {
		const admin = await this.repo
			.createQueryBuilder('a')
			.addSelect('a.password')
			.where('a.email = :email', { email })
			.getOne();
		if (!admin) return null;
		const ok = admin.password
			? await bcrypt.compare(pass, admin.password)
			: false;
		if (!ok) return null;
		if (!admin.isActive) return null;
		return admin;
	}

	async login(credentials: AdminLoginDto) {
		const admin = await this.validateCredentials(
			credentials.email,
			credentials.password,
		);

		if (!admin) throw new UnauthorizedException('Invalid credentials');

		const token = this.jwt.sign({
			sub: admin.id,
			email: admin.email,
			role: admin.role,
		});

		return { access_token: token };
	}

	async validateById(id: number) {
		return this.repo.findOne({ where: { id } });
	}
}
