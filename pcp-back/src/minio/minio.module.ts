import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { MinioService } from './services/minio.service';
import { CONFIG } from '../config/enums';
import { MINIO_BUCKET, MINIO_CLIENT } from '../common/constants';

@Module({
	providers: [
		{
			inject: [ConfigService],
			provide: MINIO_CLIENT,
			useFactory: (config: ConfigService) => {
				return new Minio.Client({
					endPoint: config.get(CONFIG.MINIO_HOST, 'localhost'),
					port: +config.get(CONFIG.MINIO_PORT),
					useSSL: false,
					accessKey: config.get(CONFIG.MINIO_USER),
					secretKey: config.get(CONFIG.MINIO_PASS),
				});
			},
		},
		{
			inject: [ConfigService],
			provide: MINIO_BUCKET,
			useFactory: (config: ConfigService) =>
				config.get(CONFIG.MINIO_BUCKET, 'default-bucket'),
		},
		MinioService,
	],
	exports: [MinioService, MINIO_BUCKET],
})
export class MinioModule {}
