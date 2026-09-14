import { Injectable, BadRequestException } from '@nestjs/common';
import { IFileStrategy } from '../interfaces/file-strategy';
import { FileFormatEnum } from '../enum/format.enum';
import { MimeTypeEnum } from '../enum/mime-type.enum';
// import { parse } from 'csv-parse/sync';

@Injectable()
export class CsvStrategy implements IFileStrategy {
	name = FileFormatEnum.CSV;

	supports(mime: MimeTypeEnum, ext?: string): boolean {
		return mime === MimeTypeEnum.TEXT_CSV || ext === 'csv';
	}

	async extract(file: Express.Multer.File): Promise<any> {
		const text = file.buffer?.toString('utf8') ?? '';
		if (!text.trim()) throw new BadRequestException('CSV is empty');

		return { detectedType: this.name, rawText: text };
	}
}
