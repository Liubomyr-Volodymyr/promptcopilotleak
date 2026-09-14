import { MimeTypeEnum } from '../enum/mime-type.enum';

export const ALLOWED_FILES = new Set<MimeTypeEnum>([
	MimeTypeEnum.APP_PDF,
	MimeTypeEnum.TEXT_CSV,
	MimeTypeEnum.APP_DOCX,
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
