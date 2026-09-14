import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContextProfilesController } from './controllers/context-profiles.controller';
import { AIModule } from '../ai/ai.module';
import { ContextProfilesService } from './services/context-profiles.service';
import { FileModule } from '../file/file.module';
import { BillingModule } from '../billing/billing.module';
import { FreeTrialsModule } from '../free-trials/free-trials.module';
import { StyleToneService } from './services/style-tone.service';
import { Profile } from './entities/profile.entity';
import { ProfileGlossary } from './entities/profile-glossary.entity';
import { BusinessProfile } from './entities/profile-business.entity';
import { PersonalProfile } from './entities/profile-personal.entity';
import { SearchProfile } from './entities/profile-search.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { ProfileAttachmentService } from './services/profile-attachment.service';
import { ProfileAttachment } from './entities/profile-attachment.entity';
import { BusinessProfileService } from './services/profiles/business-profile.service';
import { PersonalProfileService } from './services/profiles/personal-profile.service';
import { SearchProfileService } from './services/profiles/search-profile.service';
import { LinkContext } from './entities/link-context.entity';
import { LinkContextService } from './services/link-context.service';
import { LinkParserService } from './services/link-parser.service';
import { MemoryModule } from '../memory/memory.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Contact,
			Profile,
			ProfileGlossary,
			BusinessProfile,
			PersonalProfile,
			SearchProfile,
			ProfileAttachment,
			LinkContext,
		]),
		AIModule,
		FileModule,
		BillingModule,
		FreeTrialsModule,
		MemoryModule,
	],
	controllers: [ContextProfilesController],
	providers: [
		ContextProfilesService,
		BusinessProfileService,
		PersonalProfileService,
		SearchProfileService,
		StyleToneService,
		ProfileAttachmentService,
		LinkContextService,
		LinkParserService,
	],
	exports: [
		ContextProfilesService,
		ProfileAttachmentService,
		LinkContextService,
	],
})
export class ProfilesModule {}
