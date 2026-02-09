import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createTestContext,
	createUnauthenticatedContext,
} from "../../../helpers/create-test-context";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = {
	api: {
		getSession: vi.fn(),
		listSessions: vi.fn(),
		revokeSession: vi.fn(),
		revokeOtherSessions: vi.fn(),
		revokeSessions: vi.fn(),
	},
};

import * as sessionRouter from "@/integrations/orpc/router/session";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSessionContext(overrides: Record<string, unknown> = {}) {
	return createTestContext({
		auth: mockAuth,
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
// getSession
// =============================================================================

describe("getSession", () => {
	it("returns session when authenticated", async () => {
		const sessionData = {
			user: { id: "user-1", name: "Alice", email: "alice@example.com" },
			session: { id: "sess-1", activeOrganizationId: "org-1" },
		};
		mockAuth.api.getSession.mockResolvedValueOnce(sessionData);

		const ctx = createSessionContext();
		const result = await call(sessionRouter.getSession, undefined, { context: ctx });

		expect(result).toEqual(sessionData);
		expect(mockAuth.api.getSession).toHaveBeenCalledWith({
			headers: ctx.headers,
		});
	});

	it("returns null when unauthenticated (publicProcedure)", async () => {
		mockAuth.api.getSession.mockResolvedValueOnce(null);

		const ctx = createUnauthenticatedContext({
			auth: mockAuth,
		});
		const result = await call(sessionRouter.getSession, undefined, { context: ctx });

		expect(result).toBeNull();
		expect(mockAuth.api.getSession).toHaveBeenCalledWith({
			headers: ctx.headers,
		});
	});
});

// =============================================================================
// listSessions
// =============================================================================

describe("listSessions", () => {
	it("returns list of sessions", async () => {
		const sessions = [
			{ id: "sess-1", userAgent: "Chrome", createdAt: "2026-01-01" },
			{ id: "sess-2", userAgent: "Firefox", createdAt: "2026-01-02" },
		];
		mockAuth.api.listSessions.mockResolvedValueOnce(sessions);

		const ctx = createSessionContext();
		const result = await call(sessionRouter.listSessions, undefined, { context: ctx });

		expect(result).toEqual(sessions);
		expect(mockAuth.api.listSessions).toHaveBeenCalledWith({
			headers: ctx.headers,
		});
	});
});

// =============================================================================
// revokeSessionByToken
// =============================================================================

describe("revokeSessionByToken", () => {
	it("revokes session and returns success", async () => {
		mockAuth.api.revokeSession.mockResolvedValueOnce(undefined);

		const ctx = createSessionContext();
		const result = await call(
			sessionRouter.revokeSessionByToken,
			{ token: "sess-token-abc" },
			{ context: ctx },
		);

		expect(result).toEqual({ success: true });
		expect(mockAuth.api.revokeSession).toHaveBeenCalledWith({
			headers: ctx.headers,
			body: { token: "sess-token-abc" },
		});
	});
});

// =============================================================================
// revokeOtherSessions
// =============================================================================

describe("revokeOtherSessions", () => {
	it("revokes other sessions and returns success", async () => {
		mockAuth.api.revokeOtherSessions.mockResolvedValueOnce(undefined);

		const ctx = createSessionContext();
		const result = await call(sessionRouter.revokeOtherSessions, undefined, { context: ctx });

		expect(result).toEqual({ success: true });
		expect(mockAuth.api.revokeOtherSessions).toHaveBeenCalledWith({
			headers: ctx.headers,
		});
	});
});

// =============================================================================
// revokeSessions
// =============================================================================

describe("revokeSessions", () => {
	it("revokes all sessions and returns success", async () => {
		mockAuth.api.revokeSessions.mockResolvedValueOnce(undefined);

		const ctx = createSessionContext();
		const result = await call(sessionRouter.revokeSessions, undefined, { context: ctx });

		expect(result).toEqual({ success: true });
		expect(mockAuth.api.revokeSessions).toHaveBeenCalledWith({
			headers: ctx.headers,
		});
	});
});
