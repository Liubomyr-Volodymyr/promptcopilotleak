export enum LLModel {
	// --- Gemini (Google) ---
	GEMINI_FLASH = 'gemini-2.5-flash',
	GEMINI_FLASH_LITE = 'gemini-2.5-flash-lite',
	GEMINI_PRO = 'gemini-2.5-pro',

	// --- OpenAI ---
	GPT_4O = 'gpt-4o-mini',
	GPT_4_TURBO = 'gpt-4-turbo',
	GPT_35_TURBO = 'gpt-3.5-turbo',

	// --- Anthropic ---
	CLAUDE_35_SONNET = 'claude-3.5-sonnet',
	CLAUDE_35_HAIKU = 'claude-3.5-haiku',
	CLAUDE_3_OPUS = 'claude-3-opus',

	// --- Groq (Llama/Mixtral/Open Source) ---
	GROQ_LLAMA_70B = 'llama-3.3-70b-versatile',
	GROQ_LLAMA_8B = 'llama-3.1-8b-instant',
	GROQ_MIXTRAL = 'mixtral-8x7b-32768',
	GROQ_GEMMA_9B = 'gemma2-9b-it',
	GROQ_OSS = 'openai/gpt-oss-20b',

	// --- open router ---
	OPENROUTER_GPT_4O = 'openai/gpt-4o',
	OPENROUTER_LLAMA_70B = 'openrouter/llama-70b',
	OPENROUTER_QWEN = 'qwen/qwen3-next-80b-a3b-instruct',
	OPENROUTER_QWEN_CODER = 'qwen/qwen3-coder-next',
	OPENROUTER_QWEN_CODER_7B = 'qwen/qwen2.5-coder-7b',
	OPENROUTER_QWEN_BASE = 'qwen/qwen3.5-9b',
	OPENROUTER_GPT = 'openai/gpt-4.1-nano',
	OPENROUTER_GPT_4O_MINI = 'openai/gpt-4o-mini',

	// --- Midbrain ---
	MIDBRAIN_GPT_4O = 'midbrain/midbrain-gpt-4o',
	MIDBRAIN_GPT_5 = 'midbrain/gpt-5',
	MIDBRAIN_GROQ_OSS = 'groq/gpt-oss-20b',

	// --- Assistants ---
	ENHANCE_ASSISTANT = 'asst_Weub6H0ya5aWv203saKd95LV',
	GLOSSARY_ASSISTANT = 'asst_GD77QXdAgXgg3hsCtkUAQP78',
}

export enum PROJECT_KEY {
	CUSTOM = 'custom',
	INTERNAL = 'internal',
	CONTEXT = 'context',
}
