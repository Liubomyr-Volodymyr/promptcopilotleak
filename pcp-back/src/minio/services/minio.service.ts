import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { Client, ItemBucketMetadata } from 'minio';
import { MINIO_CLIENT } from '../../common/constants';
import { CONFIG } from '../../config/enums';

@Injectable()
export class MinioService implements OnModuleInit {
	private readonly logger = new Logger(MinioService.name);
	private readonly bucketName: string;

	constructor(
		@Inject(MINIO_CLIENT) private readonly client: Client,
		private readonly configService: ConfigService,
	) {
		this.bucketName = this.configService.get<string>(CONFIG.MINIO_BUCKET);
	}

	async onModuleInit() {
		try {
			await this.client.listBuckets();
			const exists = await this.client.bucketExists(this.bucketName);
			if (!exists) {
				await this.client.makeBucket(this.bucketName);
				this.logger.log(`Bucket "${this.bucketName}" created"`);
			} else {
				this.logger.log(`Bucket "${this.bucketName}" already exists`);
			}
		} catch (error) {
			this.logger.error(
				`Failed to create bucket "${this.bucketName}":`,
				error,
			);
		}
	}

	async putObject(
		key: string,
		data: Buffer | Readable | string,
		sizeOrMeta?: number | ItemBucketMetadata,
		maybeMeta?: ItemBucketMetadata,
	): Promise<any> {
		let size: number | undefined;
		let meta: ItemBucketMetadata | undefined;

		if (typeof sizeOrMeta === 'number') {
			size = sizeOrMeta;
			meta = maybeMeta;
		} else {
			meta = sizeOrMeta;
		}

		if (Buffer.isBuffer(data)) {
			return this.client.putObject(
				this.bucketName,
				key,
				data,
				data.length,
				meta,
			);
		}

		if (typeof data === 'string') {
			const byteLen = Buffer.byteLength(data);
			return this.client.putObject(
				this.bucketName,
				key,
				data,
				byteLen,
				meta,
			);
		}

		return this.client.putObject(this.bucketName, key, data, size, meta);
	}

	async getObject(key: string) {
		return this.client.getObject(this.bucketName, key);
	}

	async statObject(key: string) {
		return this.client.statObject(this.bucketName, key);
	}

	async removeObject(key: string) {
		await this.client.removeObject(this.bucketName, key);
	}

	async getPresignedGetUrl(key: string, expiresSec = 60): Promise<string> {
		const signed = await this.client.presignedGetObject(
			this.bucketName,
			key,
			expiresSec,
		);

		return signed;
	}
}
