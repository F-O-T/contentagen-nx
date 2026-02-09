import { ORPCError, call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_TEAM_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

// Factory mock for @packages/agents to prevent environment validation
vi.mock("@packages/agents", () => ({
	mastra: {
		getAgent: vi.fn(),
	},
	createRequestContext: vi.fn().mockReturnValue({}),
}));

vi.mock("@packages/events/ai");
vi.mock("@packages/events/credits");
vi.mock("@packages/database/repositories/chat-repository");

import { mastra } from "@packages/agents";
import {
	addChatMessage,
	getOrCreateChatSession,
} from "@packages/database/repositories/chat-repository";
import { emitAiChatMessage, emitAiCompletion } from "@packages/events/ai";
import {
	enforceCreditBudget,
	trackCreditUsage,
} from "@packages/events/credits";

import * as agentRouter from "@/integrations/orpc/router/agent";

// ---------------------------------------------------------------------------
// Mock Helpers
// ---------------------------------------------------------------------------

function createMockTextStream(chunks: string[]) {
	return {
		textStream: (async function* () {
			for (const chunk of chunks) {
				yield chunk;
			}
		})(),
	};
}

function createMockFullStream(
	events: Array<{ type: string; textDelta?: string }>,
) {
	return {
		fullStream: (async function* () {
			for (const event of events) {
				yield event;
			}
		})(),
	};
}

function setupAgentMock(streamResult: unknown) {
	vi.mocked(mastra.getAgent).mockReturnValue({
		stream: vi.fn().mockResolvedValue(streamResult),
	} as ReturnType<typeof mastra.getAgent>);
}

const CONTENT_ID = "a0a0a0a0-b1b1-4c2c-9d3d-e4e4e4e4e4e4";
const CHAT_SESSION_ID = "chat-sess-0000-0000-0000-000000000001";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(enforceCreditBudget).mockResolvedValue(undefined);
	vi.mocked(trackCreditUsage).mockResolvedValue(undefined);
	vi.mocked(emitAiCompletion).mockResolvedValue(undefined);
	vi.mocked(emitAiChatMessage).mockResolvedValue(undefined);
	vi.mocked(addChatMessage).mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Collects all chunks from an async iterable.
 * For generator-based oRPC procedures, `call()` returns an async iterable
 * that only begins execution when you start iterating.
 */
async function collectChunks<T>(iterable: AsyncIterable<T>): Promise<T[]> {
	const chunks: T[] = [];
	for await (const chunk of iterable) {
		chunks.push(chunk);
	}
	return chunks;
}

/**
 * For generator procedures, errors thrown *before the first yield* are
 * surfaced when you iterate, not when you call(). This helper iterates
 * the generator and expects it to throw.
 */
async function expectIterationToThrow(
	iterablePromise: Promise<AsyncIterable<unknown>>,
) {
	const iterable = await iterablePromise;
	const chunks: unknown[] = [];
	try {
		for await (const chunk of iterable) {
			chunks.push(chunk);
		}
		expect.fail("Expected iteration to throw, but it completed successfully");
	} catch (error) {
		return error;
	}
}

// =============================================================================
// fimStream
// =============================================================================

describe("fimStream", () => {
	const input = { prefix: "Hello " };

	it("enforces credit budget before streaming", async () => {
		vi.mocked(enforceCreditBudget).mockRejectedValueOnce(
			new ORPCError("FORBIDDEN", { message: "Credit exhausted" }),
		);

		const ctx = createTestContext();
		const error = await expectIterationToThrow(
			call(agentRouter.fimStream, input, { context: ctx }),
		);

		expect(error).toBeInstanceOf(ORPCError);
		expect((error as ORPCError).code).toBe("FORBIDDEN");

		expect(enforceCreditBudget).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
			"ai",
		);
	});

	it("yields text chunks from agent stream", async () => {
		setupAgentMock(createMockTextStream(["world", "!"]));

		const ctx = createTestContext();
		const iterable = await call(agentRouter.fimStream, input, { context: ctx });
		const chunks = await collectChunks(iterable);

		const textChunks = chunks.filter((c: Record<string, unknown>) => !c.done);
		expect(textChunks).toHaveLength(2);
		expect(textChunks[0]).toMatchObject({ text: "world", done: false });
		expect(textChunks[1]).toMatchObject({ text: "!", done: false });
	});

	it("yields final done chunk with metadata", async () => {
		setupAgentMock(createMockTextStream(["world"]));

		const ctx = createTestContext();
		const iterable = await call(agentRouter.fimStream, input, { context: ctx });
		const chunks = await collectChunks(iterable);

		const lastChunk = chunks.at(-1) as Record<string, unknown>;
		expect(lastChunk.done).toBe(true);
		expect(lastChunk.metadata).toBeDefined();
		expect(lastChunk.metadata.stopReason).toBe("natural");
		expect(lastChunk.metadata.latencyMs).toBeTypeOf("number");
	});

	it("emits AI completion event with teamId before final yield", async () => {
		setupAgentMock(createMockTextStream(["world"]));

		const ctx = createTestContext();
		const iterable = await call(agentRouter.fimStream, input, { context: ctx });
		await collectChunks(iterable);

		expect(emitAiCompletion).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				model: "fimAgent",
				provider: "openrouter",
				streamed: true,
			}),
		);

		expect(trackCreditUsage).toHaveBeenCalledWith(
			expect.anything(),
			"ai.completion",
			TEST_ORG_ID,
			"ai",
		);
	});
});

// =============================================================================
// editStream
// =============================================================================

describe("editStream", () => {
	const input = { selectedText: "Hello", instruction: "Fix grammar" };

	it("enforces credit budget before streaming", async () => {
		vi.mocked(enforceCreditBudget).mockRejectedValueOnce(
			new ORPCError("FORBIDDEN", { message: "Credit exhausted" }),
		);

		const ctx = createTestContext();
		const error = await expectIterationToThrow(
			call(agentRouter.editStream, input, { context: ctx }),
		);

		expect(error).toBeInstanceOf(ORPCError);
		expect((error as ORPCError).code).toBe("FORBIDDEN");

		expect(enforceCreditBudget).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
			"ai",
		);
	});

	it("yields text chunks from agent stream", async () => {
		setupAgentMock(createMockTextStream(["Fixed", " text"]));

		const ctx = createTestContext();
		const iterable = await call(agentRouter.editStream, input, { context: ctx });
		const chunks = await collectChunks(iterable);

		const textChunks = chunks.filter((c: Record<string, unknown>) => !c.done);
		expect(textChunks).toHaveLength(2);
		expect(textChunks[0]).toMatchObject({ text: "Fixed", done: false });
		expect(textChunks[1]).toMatchObject({ text: " text", done: false });
	});

	it("yields final done chunk", async () => {
		setupAgentMock(createMockTextStream(["Fixed"]));

		const ctx = createTestContext();
		const iterable = await call(agentRouter.editStream, input, { context: ctx });
		const chunks = await collectChunks(iterable);

		const lastChunk = chunks.at(-1) as Record<string, unknown>;
		expect(lastChunk.done).toBe(true);
		expect(lastChunk.text).toBe("");
	});

	it("emits AI completion event with teamId", async () => {
		setupAgentMock(createMockTextStream(["Fixed"]));

		const ctx = createTestContext();
		const iterable = await call(agentRouter.editStream, input, { context: ctx });
		await collectChunks(iterable);

		expect(emitAiCompletion).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				model: "inlineEditAgent",
				provider: "openrouter",
				streamed: true,
			}),
		);

		expect(trackCreditUsage).toHaveBeenCalledWith(
			expect.anything(),
			"ai.completion",
			TEST_ORG_ID,
			"ai",
		);
	});
});

// =============================================================================
// chatStream
// =============================================================================

describe("chatStream", () => {
	it("enforces credit budget before streaming", async () => {
		vi.mocked(enforceCreditBudget).mockRejectedValueOnce(
			new ORPCError("FORBIDDEN", { message: "Credit exhausted" }),
		);

		const ctx = createTestContext();
		const error = await expectIterationToThrow(
			call(agentRouter.chatStream, { message: "Hello" }, { context: ctx }),
		);

		expect(error).toBeInstanceOf(ORPCError);
		expect((error as ORPCError).code).toBe("FORBIDDEN");

		expect(enforceCreditBudget).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
			"ai",
		);
	});

	it("creates chat session when contentId is provided", async () => {
		vi.mocked(getOrCreateChatSession).mockResolvedValueOnce({
			id: CHAT_SESSION_ID,
		} as { id: string });

		setupAgentMock(
			createMockFullStream([{ type: "text-delta", textDelta: "Hi" }]),
		);

		const ctx = createTestContext();
		const iterable = await call(
			agentRouter.chatStream,
			{ message: "Hello", contentId: CONTENT_ID },
			{ context: ctx },
		);
		await collectChunks(iterable);

		expect(getOrCreateChatSession).toHaveBeenCalledWith(
			expect.anything(),
			CONTENT_ID,
			TEST_ORG_ID,
		);

		// User message should be saved
		expect(addChatMessage).toHaveBeenCalledWith(
			expect.anything(),
			CHAT_SESSION_ID,
			"user",
			"Hello",
		);
	});

	it("yields text chunks from fullStream", async () => {
		setupAgentMock(
			createMockFullStream([
				{ type: "text-delta", textDelta: "Hi" },
				{ type: "text-delta", textDelta: " there" },
			]),
		);

		const ctx = createTestContext();
		const iterable = await call(
			agentRouter.chatStream,
			{ message: "Hello" },
			{ context: ctx },
		);
		const chunks = await collectChunks(iterable);

		const textChunks = chunks.filter((c: Record<string, unknown>) => c.type === "text");
		expect(textChunks).toHaveLength(2);
		expect(textChunks[0]).toMatchObject({ type: "text", text: "Hi" });
		expect(textChunks[1]).toMatchObject({
			type: "text",
			text: " there",
		});

		// Last chunk should be done
		const lastChunk = chunks.at(-1) as Record<string, unknown>;
		expect(lastChunk.type).toBe("done");
	});

	it("emits chat message event with teamId when session exists", async () => {
		vi.mocked(getOrCreateChatSession).mockResolvedValueOnce({
			id: CHAT_SESSION_ID,
		} as { id: string });

		setupAgentMock(
			createMockFullStream([{ type: "text-delta", textDelta: "Hi" }]),
		);

		const ctx = createTestContext();
		const iterable = await call(
			agentRouter.chatStream,
			{ message: "Hello", contentId: CONTENT_ID },
			{ context: ctx },
		);
		await collectChunks(iterable);

		expect(emitAiChatMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				chatId: CHAT_SESSION_ID,
				contentId: CONTENT_ID,
				model: "writerAgent",
				role: "assistant",
			}),
		);

		expect(trackCreditUsage).toHaveBeenCalledWith(
			expect.anything(),
			"ai.chat_message",
			TEST_ORG_ID,
			"ai",
		);
	});
});
