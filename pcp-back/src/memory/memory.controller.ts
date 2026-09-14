import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { GetContextDto } from './dto/get-context.dto';
import { MemoryConsolidateService } from './services/memory-consolidate.service';
import { JwtAuthGuard } from '../auth/guards';
import { InjectContextResponse } from './dto/inject-context.response.dto';

@Controller('memory')
@ApiTags('Memory')
@ApiBearerAuth('access_token')
export class MemoryController {
	constructor(
		private readonly memoryConsolidateService: MemoryConsolidateService,
	) {}

	@Get('inject-context')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Get memory for inject context (memory profile)' })
	async getInjectionMemory(
		@Param() input: string,
		@Req() req: Request,
	): Promise<InjectContextResponse> {
		return this.memoryConsolidateService.getInjectContext(
			input,
			req.user.userId,
		);
	}

	/**
	 * Get variables to GoP prompt using copilot memory
	 * */
	@Post('get-context')
	@UseGuards(JwtAuthGuard)
	@ApiBody({ type: GetContextDto })
	async getPromptContext(
		@Body() getContextDto: GetContextDto,
		@Req() req: Request,
	): Promise<object> {
		return this.memoryConsolidateService.getContext(
			req.user.userId,
			getContextDto,
		);
	}
}
