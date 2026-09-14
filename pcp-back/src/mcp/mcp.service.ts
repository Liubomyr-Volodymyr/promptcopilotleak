import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';
import { EnhanceService } from '../features/services/enhance.service';
import { MemoryRetrievalService } from '../memory/services/memory-retrieval.service';
import { MemoryAgentService } from '../memory/services/memory-agent.service';

type McpTool = {
	options: { inputSchema: Record<string, z.ZodTypeAny>; description?: string };
	handler: (args: any) => Promise<{ content: { type: 'text'; text: string }[] }>;
};

@Injectable()
export class McpService {
	constructor(
		private readonly enhanceService: EnhanceService,
		private readonly memoryRetrievalService: MemoryRetrievalService,
		private readonly memoryAgentService: MemoryAgentService,
	) {}

	createServer(user: any): McpServer {
		const server = new McpServer({
			name: 'prompt-copilot',
			title: 'Prompt Copilot',
			version: '1.0.0',
		});

		this.registerTools(server, user);

		return server;
	}

	private registerTools(server: McpServer, user: any) {
		for (const [name, tool] of Object.entries(this.getTools(user))) {
			(server.registerTool as any)(name, tool.options, tool.handler);
		}
	}

	private toTextContent(text: string) {
		return { content: [{ type: 'text' as const, text }] };
	}

	private getTools(user: any): Record<string, McpTool> {
		const { userId } = user;

		return {
			enhance: {
				options: {
					description: 'Enhance and improve a given text using user context and memory',
					inputSchema: {
						text: z.string().describe('The text to enhance'),
					},
				},
				handler: async ({ text }: { text: string }) => {
					const enhanced = await this.enhanceService.enhanceContext(userId, text);
					return this.toTextContent(enhanced);
				},
			},

			search_memory: {
				options: {
					description: 'Search user memory for relevant past conversations, notes, or context',
					inputSchema: {
						query: z.string().describe('Search query to find relevant memories'),
						limit: z.number().optional().describe('Max number of results (default: 5)'),
					},
				},
				handler: async ({ query, limit }: { query: string; limit?: number }) => {
					await this.memoryAgentService.ensureAgent(Number(userId));
					const memories = await this.memoryRetrievalService.retrieve({
						userId,
						query,
						limit: limit ?? 5,
					});

					if (!memories.length) {
						return this.toTextContent('No relevant memories found.');
					}

					const formatted = memories
						.map((m, i) => `${i + 1}. ${m.content ?? ''}`)
						.join('\n');

					return this.toTextContent(`Found ${memories.length} memories:\n\n${formatted}`);
				},
			},

			get_memory_profile: {
				options: {
					description: 'Get the user memory profile — a summary of who the user is',
					inputSchema: {},
				},
				handler: async () => {
					await this.memoryAgentService.ensureAgent(Number(userId));
					const profile = await this.memoryRetrievalService.retrieveProfile(userId);
					const text = profile?.description ?? 'No memory profile available.';
					return this.toTextContent(text);
				},
			},

			get_semantic_memory: {
				options: {
					description: 'Get user semantic memory — uploaded documents, files, and knowledge base',
					inputSchema: {
						limit: z.number().optional().describe('Max number of results (default: 5)'),
					},
				},
				handler: async ({ limit }: { limit?: number }) => {
					const result = await this.memoryRetrievalService.retrieveSemantic({
						userId,
						limit: limit ?? 5,
					});

					const items = result?.items ?? [];

					if (!items.length) {
						return this.toTextContent('No semantic memory found.');
					}

					const formatted = items
						.map((m: any, i: number) => `${i + 1}. ${m.content ?? m.text ?? JSON.stringify(m)}`)
						.join('\n');

					return this.toTextContent(`Found ${items.length} documents:\n\n${formatted}`);
				},
			},
		};
	}
}
