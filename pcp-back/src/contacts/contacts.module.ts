import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { ContactProvider } from './entities/contact-provider.entity';
import { ContactVerification } from './entities/contact-verification.entity';
import { ContactController } from './controllers/contact.controller';
import { ContactService, ContactVerificationService } from './services';
import { MinioModule } from '../minio/minio.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Contact,
			ContactProvider,
			ContactVerification,
		]),
		MinioModule,
	],
	controllers: [ContactController],
	providers: [ContactService, ContactVerificationService],
	exports: [ContactService, ContactVerificationService],
})
export class ContactsModule {}
