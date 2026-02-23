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

vi.mock("@packages/agents/models", () => ({
	AUTOCOMPLETE_MODELS: {},
	CONTENT_MODELS: {},
	DEFAULT_AUTOCOMPLETE_MODEL_ID: "test-autocomplete-model",
	DEFAULT_CONTENT_MODEL_ID: "test-content-model",
	getModelPreset: vi.fn().mockReturnValue({
		temperature: 0.7,
		topP: 1,
		maxTokens: 4096,
		frequencyPenalty: 0,
		presencePenalty: 0,
	}),
}));

vi.mock("@packages/events/ai");
vi.mock("@packages/events/credits");
vi.mock("@packages/database/repositories/product-settings-repository");

import { mastra } from "@packages/agents";
import { emitAiCompletion } from "@packages/events/ai";
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
	} as unknown as ReturnType<typeof mastra.getAgent>);
}

const CONTENT_ID = "a0a0a0a0-b1b1-4c2c-9d3d-e4e4e4e4e4e4";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(enforceCreditBudget).mockResolvedValue(undefined);
	vi.mocked(trackCreditUsage).mockResolvedValue(undefined);
	vi.mocked(emitAiCompletion).mockResolvedValue(undefined);
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

describe("copilotStream", () => {
	const input = { prefix: "Hello " };

	it("enforces credit budget before streaming", async () => {
		vi.mocked(enforceCreditBudget).mockRejectedValueOnce(
			new ORPCError("FORBIDDEN", { message: "Credit exhausted" }),
		);

		const ctx = createTestContext();
		const error = await expectIterationToThrow(
			call(agentRouter.copilotStream, input, { context: ctx }),
		);

		expect(error).toBeInstanceOf(ORPCError);
		expect((error as ORPCError<string, unknown>).code).toBe("FORBIDDEN");

		expect(enforceCreditBudget).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
			"ai",
		);
	});

	it("yields text chunks from agent stream", async () => {
		setupAgentMock(createMockTextStream(["world", "!"]));

		const ctx = createTestContext();
		const iterable = await call(agentRouter.copilotStream, input, { context: ctx });
		const chunks = await collectChunks(iterable);

		const textChunks = chunks.filter((c: Record<string, unknown>) => !c.done);
		expect(textChunks).toHaveLength(2);
		expect(textChunks[0]).toMatchObject({ text: "world", done: false });
		expect(textChunks[1]).toMatchObject({ text: "!", done: false });
	});

	it("yields final done chunk with metadata", async () => {
		setupAgentMock(createMockTextStream(["world"]));

		const ctx = createTestContext();
		const iterable = await call(agentRouter.copilotStream, input, { context: ctx });
		const chunks = await collectChunks(iterable);

		const lastChunk = chunks.at(-1) as Record<string, unknown>;
		expect(lastChunk.done).toBe(true);
		expect(lastChunk.metadata).toBeDefined();
		expect((lastChunk.metadata as any).stopReason).toBe("natural");
		expect((lastChunk.metadata as any).latencyMs).toBeTypeOf("number");
	});

	it("emits AI completion event with teamId before final yield", async () => {
		setupAgentMock(createMockTextStream(["world"]));

		const ctx = createTestContext();
		const iterable = await call(agentRouter.copilotStream, input, { context: ctx });
		await collectChunks(iterable);

		expect(emitAiCompletion).toHaveBeenCalledWith(
			expect.any(Function),
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
// aiCommandStream
// =============================================================================

describe("aiCommandStream", () => {
	it("enforces credit budget before streaming", async () => {
		vi.mocked(enforceCreditBudget).mockRejectedValueOnce(
			new ORPCError("FORBIDDEN", { message: "Credit exhausted" }),
		);

		const ctx = createTestContext();
		const error = await expectIterationToThrow(
			call(agentRouter.aiCommandStream, { prompt: "Hello" }, { context: ctx }),
		);

		expect(error).toBeInstanceOf(ORPCError);
		expect((error as ORPCError<string, unknown>).code).toBe("FORBIDDEN");

		expect(enforceCreditBudget).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
			"ai",
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
			agentRouter.aiCommandStream,
			{ prompt: "Hello" },
			{ context: ctx },
		);
		const chunks = await collectChunks(iterable);

		const textChunks = chunks.filter(
			(c: Record<string, unknown>) => c.type === "text",
		);
		expect(textChunks).toHaveLength(2);
		expect(textChunks[0]).toMatchObject({ type: "text", text: "Hi" });
		expect(textChunks[1]).toMatchObject({ type: "text", text: " there" });

		// Last chunk should be done
		const lastChunk = chunks.at(-1) as Record<string, unknown>;
		expect(lastChunk.type).toBe("done");
	});

	it("emits ai.completion event after streaming", async () => {
		setupAgentMock(
			createMockFullStream([{ type: "text-delta", textDelta: "Hi" }]),
		);

		const ctx = createTestContext();
		const iterable = await call(
			agentRouter.aiCommandStream,
			{ prompt: "Hello", contentId: CONTENT_ID },
			{ context: ctx },
		);
		await collectChunks(iterable);

		expect(emitAiCompletion).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				model: "unifiedContent",
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
