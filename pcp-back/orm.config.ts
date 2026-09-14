import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';
import { MainSeeder } from './src/seeds/main-seeder';
import { CONFIG } from './src/config/enums';

config();
const configService = new ConfigService();

const options: DataSourceOptions & SeederOptions = {
	type: 'postgres',
	host: configService.get(CONFIG.POSTGRES_HOST),
	port: configService.get(CONFIG.POSTGRES_PORT),
	username: configService.get(CONFIG.POSTGRES_USER),
	password: configService.get(CONFIG.POSTGRES_PASSWORD),
	database: configService.get(CONFIG.POSTGRES_DB),
	entities: ['src/**/*.entity.ts'],
	migrations: ['migrations/*.ts'],
	seeds: [MainSeeder],
};

export default new DataSource(options);
