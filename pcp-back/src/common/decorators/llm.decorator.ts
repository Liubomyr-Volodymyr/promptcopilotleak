import { SetMetadata } from '@nestjs/common';
import { LLModel } from '../enums';

export const LLM_META_KEY = 'llm:model';
export const UseLLM = (model: LLModel) => SetMetadata(LLM_META_KEY, model);
