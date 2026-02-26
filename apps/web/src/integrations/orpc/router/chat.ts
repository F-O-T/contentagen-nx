import { ORPCError } from "@orpc/server";
import { mastra } from "@packages/agents";
import { z } from "zod";
import { protectedProcedure } from "../server";

const getMemory = async () => {
	const memory = await mastra.getAgent("unifiedContent").getMemory();
	if (!memory) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Memory not configured" });
	return memory;
};

export const listThreads = protectedProcedure
	.input(
		z.object({
			teamId: z.uuid(),
			page: z.number().int().min(0).default(0),
			perPage: z.number().int().min(1).max(50).default(20),
		}),
	)
	.handler(async ({ context, input }) => {
		const memory = await getMemory();
		const result = await memory.listThreads({
			filter: { resourceId: `${input.teamId}:${context.userId}` },
			page: input.page,
			perPage: input.perPage,
			orderBy: { field: "updatedAt", direction: "DESC" },
		});
		return {
			threads: result.threads.map((t) => ({
				id: t.id,
				title: t.title ?? "Nova conversa",
				createdAt: t.createdAt,
				updatedAt: t.updatedAt,
			})),
			total: result.total,
			hasMore: result.hasMore,
		};
	});

export const createThread = protectedProcedure
	.input(
		z.object({
			teamId: z.uuid(),
			title: z.string().optional(),
			metadata: z.record(z.unknown()).optional(),
		}),
	)
	.handler(async ({ context, input }) => {
		const memory = await getMemory();
		const thread = await memory.createThread({
			resourceId: `${input.teamId}:${context.userId}`,
			title: input.title,
			metadata: input.metadata,
		});
		return { id: thread.id, title: thread.title ?? "Nova conversa", createdAt: thread.createdAt };
	});

export const getThread = protectedProcedure
	.input(z.object({ threadId: z.string() }))
	.handler(async ({ input }) => {
		const memory = await getMemory();
		const thread = await memory.getThreadById({ threadId: input.threadId });
		if (!thread) throw new ORPCError("NOT_FOUND", { message: "Thread not found" });
		return {
			id: thread.id,
			title: thread.title ?? "Nova conversa",
			createdAt: thread.createdAt,
			updatedAt: thread.updatedAt,
			resourceId: thread.resourceId,
		};
	});

export const cloneThread = protectedProcedure
	.input(
		z.object({
			sourceThreadId: z.string(),
			teamId: z.uuid(),
			title: z.string().optional(),
			messageLimit: z.number().int().min(1).optional(),
		}),
	)
	.handler(async ({ context, input }) => {
		const memory = await getMemory();
		const { thread } = await memory.cloneThread({
			sourceThreadId: input.sourceThreadId,
			resourceId: `${input.teamId}:${context.userId}`,
			title: input.title,
			options: input.messageLimit ? { messageLimit: input.messageLimit } : undefined,
		});
		return { id: thread.id, title: thread.title ?? "Nova conversa", createdAt: thread.createdAt };
	});
