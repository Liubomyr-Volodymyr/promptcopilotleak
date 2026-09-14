import { ISemanticMemoryResponse } from './semantic-memory.response';
import { IProceduralMemoryResponse } from './procedural-memory.response';
import { IMemoryProfileResponse } from './memory-profile.response.interface';

export interface ProceduralPagination {
	total: number;
	page: number;
	limit: number;
	items: IProceduralMemoryResponse[];
}

export interface MemoryProvider {
	getProfile(
		input: Partial<SearchMemoryInput>,
	): Promise<IMemoryProfileResponse>;
	remember(
		userId: string,
		input: RememberEpisodicMemoryInput,
		profileId?: string | null,
	): Promise<void>;
	search(input: SearchMemoryInput): Promise<MemoryRecord[]>;
	getSemantic(
		input: Partial<SearchMemoryInput>,
	): Promise<ISemanticMemoryResponse>;
	getProcedural(
		input: Partial<SearchMemoryInput>,
	): Promise<ProceduralPagination>;
	getEpisodic(input: GetEpisodicMemoryInput): Promise<MemoryRecord[]>;
	delete(input: DeleteMemoryInput): Promise<void>;
}

export interface MemoryRecord {
	id: string;

	content: string;

	type: string;

	score: number;

	metadata?: Record<string, any>;

	createdAt: Date;
}

export interface SearchMemoryInput {
	query: string;
	limit?: number;
	userId?: string;
	profileId?: string | null;
}

export interface GetEpisodicMemoryInput {
	userId: string;
	conversationId: string;
	limit?: number;
	profileId?: string | null;
}

export interface RememberEpisodicMemoryInput {
	text: string;
	role?: string;
	memory_metadata: Record<string, any>;
	occurred_at: string;
}

export interface DeleteMemoryInput {
	userId: string;

	profileId?: string | null;

	memoryId?: string;

	type?: string;

	olderThan?: Date;
}
