import { Module } from '@nestjs/common';
import { SysPromptController } from './sys-prompt.controller';
import { AIModule } from '../../../ai/ai.module';

@Module({
	imports: [AIModule],
	controllers: [SysPromptController],
})
export class SysPromptModule {}
