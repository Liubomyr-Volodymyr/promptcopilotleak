import { Injectable } from '@nestjs/common';
import { IFileStrategy } from '../interfaces/file-strategy';
import { FileFormatEnum } from '../enum/format.enum';
import { MimeTypeEnum } from '../enum/mime-type.enum';

@Injectable()
export class PdfStrategy implements IFileStrategy {
	name = FileFormatEnum.PDF;

	private pdfParse!: (buf: Buffer) => Promise<{ text: string }>;
	private loaded = false;

	supports(mime: MimeTypeEnum, ext?: string) {
		return mime === MimeTypeEnum.APP_PDF || ext === 'pdf';
	}

	private async ensureLib() {
		if (!this.loaded) {
			const mod = await import('pdf-parse');
			this.pdfParse = (mod as any).default;
			this.loaded = true;
		}
	}

	async extract(file: Express.Multer.File): Promise<any> {
		await this.ensureLib();
		const { text } = await this.pdfParse(file.buffer);
		return { detectedType: this.name, rawText: text };
	}
}
