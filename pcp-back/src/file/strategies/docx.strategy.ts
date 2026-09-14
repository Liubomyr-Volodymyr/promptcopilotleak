import { Injectable } from '@nestjs/common';
import { IFileStrategy } from '../interfaces/file-strategy';
import { FileFormatEnum } from '../enum/format.enum';
import { MimeTypeEnum } from '../enum/mime-type.enum';

@Injectable()
export class DocxStrategy implements IFileStrategy {
	name = FileFormatEnum.DOCX;
	private mammoth?: any;
	private loaded = false;

	supports(mime: MimeTypeEnum, ext?: string): boolean {
		return mime === MimeTypeEnum.APP_DOCX || ext === 'docx';
	}

	private async ensureLib() {
		if (!this.loaded) {
			this.mammoth = await import('mammoth');
			this.loaded = true;
		}
	}

	async extract(file: Express.Multer.File): Promise<any> {
		await this.ensureLib();

		const { value } = await this.mammoth.extractRawText({
			buffer: file.buffer,
		});
		const text = this.normalize(value || '');

		return {
			detectedType: this.name,
			rawText: text,
		};
	}

	private normalize(txt: string): string {
		return txt
			.replace(/\r/g, '')
			.replace(/[ \t]+/g, ' ')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}
}
