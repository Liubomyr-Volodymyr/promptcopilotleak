import { PartialType } from '@nestjs/mapped-types';
import { CreateLlmConfigDto } from './create-llm-config.dto';

export class UpdateLlmConfigDto extends PartialType(CreateLlmConfigDto) {}
