import { FileFormatEnum } from '../enum/format.enum';

export interface IFileStrategy {
	name: FileFormatEnum;
	supports(mime: string, ext?: string): boolean;
	extract(file: Express.Multer.File): Promise<any>;
}
