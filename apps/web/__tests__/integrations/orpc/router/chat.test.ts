import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	createTestContext,
} from "../../../helpers/create-test-context";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/chat-repository");

import { getChatSessionWithMessages } from "@packages/database/repositories/chat-repository";

import * as chatRouter from "@/integrations/orpc/router/chat";

// ---------------------------------------------------------------------------
// Mock Helpers
// ---------------------------------------------------------------------------

const CONTENT_ID = "a0a0a0a0-b1b1-4c2c-9d3d-e4e4e4e4e4e4";

function makeChatSession(overrides = {}) {
	return {
		id: "session-1",
		messages: [
			{
				id: "msg-1",
				role: "user",
				content: "Hello",
				createdAt: new Date("2026-01-01"),
				toolCalls: null,
			},
			{
				id: "msg-2",
				role: "assistant",
				content: "Hi there!",
				createdAt: new Date("2026-01-01"),
				toolCalls: [],
			},
		],
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createChatContext(overrides = {}) {
	return createTestContext({
		db: {},
		...overrides,
	});
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// getChatHistory
// =============================================================================

describe("getChatHistory", () => {
	it("returns empty messages when no session exists", async () => {
		vi.mocked(getChatSessionWithMessages).mockResolvedValueOnce(null);

		const ctx = createChatContext();
		const result = await call(
			chatRouter.getChatHistory,
			{ contentId: CONTENT_ID },
			{ context: ctx },
		);

		expect(result).toEqual({
			sessionId: null,
			messages: [],
		});

		expect(getChatSessionWithMessages).toHaveBeenCalledWith(
			expect.anything(),
			CONTENT_ID,
			TEST_ORG_ID,
		);
	});

	it("returns session with user messages correctly formatted", async () => {
		const session = makeChatSession({
			messages: [
				{
					id: "msg-1",
					role: "user",
					content: "Hello",
					createdAt: new Date("2026-01-01"),
					toolCalls: null,
				},
			],
		});
		vi.mocked(getChatSessionWithMessages).mockResolvedValueOnce(session);

		const ctx = createChatContext();
		const result = await call(
			chatRouter.getChatHistory,
			{ contentId: CONTENT_ID },
			{ context: ctx },
		);

		expect(result.sessionId).toBe("session-1");
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0]).toEqual({
			id: "msg-1",
			role: "user",
			content: [{ type: "text", text: "Hello" }],
			createdAt: new Date("2026-01-01"),
		});
	});

	it("returns session with assistant messages including text content", async () => {
		const session = makeChatSession({
			messages: [
				{
					id: "msg-2",
					role: "assistant",
					content: "Hi there!",
					createdAt: new Date("2026-01-01"),
					toolCalls: [],
				},
			],
		});
		vi.mocked(getChatSessionWithMessages).mockResolvedValueOnce(session);

		const ctx = createChatContext();
		const result = await call(
			chatRouter.getChatHistory,
			{ contentId: CONTENT_ID },
			{ context: ctx },
		);

		expect(result.sessionId).toBe("session-1");
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0]).toEqual({
			id: "msg-2",
			role: "assistant",
			content: [{ type: "text", text: "Hi there!" }],
			createdAt: new Date("2026-01-01"),
		});
	});

	it("returns session with assistant messages including tool calls", async () => {
		const session = makeChatSession({
			messages: [
				{
					id: "msg-3",
					role: "assistant",
					content: "Let me search that for you.",
					createdAt: new Date("2026-01-01"),
					toolCalls: [
						{
							id: "tc-1",
							name: "webSearch",
							args: { query: "contentta cms" },
							result: { results: ["found it"] },
						},
					],
				},
			],
		});
		vi.mocked(getChatSessionWithMessages).mockResolvedValueOnce(session);

		const ctx = createChatContext();
		const result = await call(
			chatRouter.getChatHistory,
			{ contentId: CONTENT_ID },
			{ context: ctx },
		);

		expect(result.sessionId).toBe("session-1");
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0]).toEqual({
			id: "msg-3",
			role: "assistant",
			content: [
				{ type: "text", text: "Let me search that for you." },
				{
					type: "tool-call",
					toolCallId: "tc-1",
					toolName: "webSearch",
					args: { query: "contentta cms" },
					result: { results: ["found it"] },
				},
			],
			createdAt: new Date("2026-01-01"),
		});
	});
});
