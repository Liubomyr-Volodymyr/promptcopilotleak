export interface IEpisodicMemoryResponse {
	id: string;
	content: string;
	type: string;
	score: number;
	metadata?: Record<string, any>;
	createdAt: Date;
}
