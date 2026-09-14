import { Module } from '@nestjs/common';
import { AutocompleteService } from './services/autocomplete.service';
import { AIModule } from '../ai/ai.module';
import { ContactsModule } from '../contacts/contacts.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AutocompleteController } from './controllers/autocomplete.controller';
import { AuthModule } from '../auth/auth.module';
import { PromptRequestService } from './services/prompt-request.service';
import { EnhanceService } from './services/enhance.service';
import { BillingModule } from '../billing/billing.module';
import { FreeTrialsModule } from '../free-trials/free-trials.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuggestionFeedback } from './entities/feedback.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { EnhanceController } from './controllers/enhance.controller';
import { ClientPrompt } from './entities/prompt-request.entity';
import { CryptoModule } from '../crypto/crypto.module';
import { LlmConfigEntity } from '../ai/entities/llm-config.entity';
import { SysPromptModule } from '../admin/modules/sys-prompts/sys-prompts.module';
import { MemoryModule } from '../memory/memory.module';
import { MemoryStoreService } from './services/memory-store.service';
import { AdminAuthModule } from '../admin/modules/auth/admin-auth.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			SuggestionFeedback,
			Contact,
			Profile,
			ClientPrompt,
			LlmConfigEntity,
		]),
		AIModule,
		AuthModule,
		ContactsModule,
		ProfilesModule,
		CryptoModule,
		BillingModule,
		FreeTrialsModule,
		SysPromptModule,
		MemoryModule,
		AdminAuthModule,
	],
	providers: [
		AutocompleteService,
		EnhanceService,
		PromptRequestService,
		MemoryStoreService,
	],
	controllers: [AutocompleteController, EnhanceController],
	exports: [PromptRequestService, MemoryStoreService, EnhanceService],
})
export class FeaturesModule {}
