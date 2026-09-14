import { Module } from '@nestjs/common';
import { ProfileImportService } from './services/profile-import.service';
import { PdfStrategy } from './strategies/pdf.strategy';
import { DocxStrategy } from './strategies/docx.strategy';
import { CsvStrategy } from './strategies/csv.strategy';
import { PROFILE_IMPORT_STRATEGIES } from '../common/constants';

const STRATEGY_CLASSES = [PdfStrategy, DocxStrategy, CsvStrategy];

@Module({
	providers: [
		...STRATEGY_CLASSES,
		{
			provide: PROFILE_IMPORT_STRATEGIES,
			useFactory: (...strategies) => strategies,
			inject: [...STRATEGY_CLASSES],
		},
		ProfileImportService,
	],
	exports: [ProfileImportService],
})
export class FileModule {}
