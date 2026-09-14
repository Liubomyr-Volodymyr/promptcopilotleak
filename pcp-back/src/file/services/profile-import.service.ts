import {
	Inject,
	Injectable,
	UnsupportedMediaTypeException,
} from '@nestjs/common';
import { IFileStrategy } from '../interfaces/file-strategy';
import { PROFILE_IMPORT_STRATEGIES } from '../../common/constants';

@Injectable()
export class ProfileImportService {
	constructor(
		@Inject(PROFILE_IMPORT_STRATEGIES)
		private readonly strategies: IFileStrategy[],
	) {}

	async detectAndExtract(file: Express.Multer.File): Promise<any> {
		if (!file) throw new UnsupportedMediaTypeException('File is required');

		const mime = file.mimetype || '';
		const ext = this.guessExt(file.originalname);
		const strat = this.strategies.find((s) => s.supports(mime, ext));

		if (!strat) {
			throw new UnsupportedMediaTypeException(
				`Unsupported file type: ${mime || ext}`,
			);
		}
		return strat.extract(file);
	}

	private guessExt(name: string): string | undefined {
		const i = name.lastIndexOf('.');
		return i >= 0 ? name.slice(i + 1).toLowerCase() : undefined;
	}
}
