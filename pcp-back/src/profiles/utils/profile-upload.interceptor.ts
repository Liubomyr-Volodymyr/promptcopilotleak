import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
	ALLOWED_FILES,
	MAX_FILE_SIZE_BYTES,
} from '../../file/constants/allowed-mime';
import { MimeTypeEnum } from '../../file/enum/mime-type.enum';

export const ProfileUploadInterceptor = (fieldName = 'file') =>
	FileInterceptor(fieldName, {
		storage: memoryStorage(),
		limits: { fileSize: MAX_FILE_SIZE_BYTES },
		fileFilter: (_req, file, cb) => {
			if (!ALLOWED_FILES.has(file.mimetype as MimeTypeEnum)) {
				return cb(
					new BadRequestException('Unsupported file type'),
					false,
				);
			}
			cb(null, true);
		},
	});
