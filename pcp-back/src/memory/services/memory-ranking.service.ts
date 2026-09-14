import { Injectable } from '@nestjs/common';
import { MemoryRecord, SearchMemoryInput } from '../providers/interfaces';

@Injectable()
export class MemoryRankingService {
	rank(memories: MemoryRecord[], input: SearchMemoryInput): MemoryRecord[] {
		return memories
			.map((m) => ({
				...m,
				score: this.score(m, input),
			}))
			.sort((a, b) => b.score - a.score);
	}

	private score(memory: MemoryRecord, input: SearchMemoryInput): number {
		const semanticScore = this.normalize(memory.score);

		const recencyScore = this.getRecencyScore(memory.createdAt);

		const typeScore = this.getTypeBoost(memory.type);

		const queryScore = this.getQueryMatch(memory.content, input.query);

		const noisePenalty = this.getNoisePenalty(memory.content);

		// balanced production weights
		return (
			semanticScore * 0.7 +
			recencyScore * 0.15 +
			typeScore * 0.1 +
			queryScore * 0.05 -
			noisePenalty * 0.05
		);
	}

	private normalize(score: any): number {
		if (!isFinite(score)) return 0;

		// soft normalization instead of clamp
		return 1 / (1 + Math.exp(-score));
	}

	private getRecencyScore(createdAt: any): number {
		if (!createdAt) return 0;

		const date = new Date(createdAt);
		if (isNaN(date.getTime())) return 0;

		const ageMinutes = (Date.now() - date.getTime()) / 1000 / 60;

		return Math.exp(-ageMinutes / 1440);
	}

	private getTypeBoost(type?: string): number {
		switch (type) {
			case 'procedural':
				return 1.0;
			case 'semantic':
				return 0.85;
			case 'episodic':
				return 0.7;
			case 'workflow':
				return 0.75;
			case 'behavior':
				return 0.8;
			default:
				return 0.5;
		}
	}

	private getQueryMatch(content: any, query: string): number {
		if (!content || !query) return 0;

		const c = String(content).toLowerCase();
		const q = query.toLowerCase();

		if (c === q) return 1;
		if (c.includes(q)) return 0.75;

		const tokens = q.split(' ').filter(Boolean);
		if (!tokens.length) return 0;

		const matchCount = tokens.filter((t) => c.includes(t)).length;

		return matchCount / tokens.length;
	}

	private getNoisePenalty(content: any): number {
		if (!content) return 0;

		const length = String(content).length;

		if (length < 200) return 0;
		if (length < 800) return 0.2;
		if (length < 1500) return 0.5;

		return 0.9;
	}
}
