import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createTestContext,
} from "../../../helpers/create-test-context";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/environment/server", () => ({
	env: {
		MINIO_ENDPOINT: "http://localhost:9000",
		MINIO_ACCESS_KEY: "test",
		MINIO_SECRET_KEY: "test",
	},
}));

vi.mock("@packages/files/client", () => ({
	getMinioClient: vi.fn(),
	generatePresignedPutUrl: vi.fn(),
}));

const mockAuth = {
	api: {
		verifyPassword: vi.fn(),
		listUserAccounts: vi.fn(),
	},
};

import * as accountRouter from "@/integrations/orpc/router/account";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createAccountContext(overrides = {}) {
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
// verifyPassword
// =============================================================================

describe("verifyPassword", () => {
	it("returns { valid: true } when password is correct", async () => {
		mockAuth.api.verifyPassword.mockResolvedValueOnce({});

		const ctx = createAccountContext();
		const result = await call(accountRouter.verifyPassword, { password: "correct-pass" }, { context: ctx });

		expect(result).toEqual({ valid: true });
		expect(mockAuth.api.verifyPassword).toHaveBeenCalledWith({
			headers: ctx.headers,
			body: { password: "correct-pass" },
		});
	});

	it("returns { valid: false } when auth throws", async () => {
		mockAuth.api.verifyPassword.mockRejectedValueOnce(new Error("Invalid password"));

		const ctx = createAccountContext();
		const result = await call(accountRouter.verifyPassword, { password: "wrong-pass" }, { context: ctx });

		expect(result).toEqual({ valid: false });
	});
});

// =============================================================================
// hasPassword
// =============================================================================

describe("hasPassword", () => {
	it("returns { hasPassword: true } when credential account exists", async () => {
		mockAuth.api.listUserAccounts.mockResolvedValueOnce([
			{ providerId: "credential", accountId: "acc-1" },
			{ providerId: "google", accountId: "acc-2" },
		]);

		const ctx = createAccountContext();
		const result = await call(accountRouter.hasPassword, undefined, { context: ctx });

		expect(result).toEqual({ hasPassword: true });
		expect(mockAuth.api.listUserAccounts).toHaveBeenCalledWith({
			headers: ctx.headers,
		});
	});

	it("returns { hasPassword: false } when only OAuth accounts", async () => {
		mockAuth.api.listUserAccounts.mockResolvedValueOnce([
			{ providerId: "google", accountId: "acc-1" },
			{ providerId: "github", accountId: "acc-2" },
		]);

		const ctx = createAccountContext();
		const result = await call(accountRouter.hasPassword, undefined, { context: ctx });

		expect(result).toEqual({ hasPassword: false });
	});
});

// =============================================================================
// getLinkedAccounts
// =============================================================================

describe("getLinkedAccounts", () => {
	it("returns mapped accounts list", async () => {
		const now = new Date("2026-01-15");
		mockAuth.api.listUserAccounts.mockResolvedValueOnce([
			{ providerId: "google", accountId: "google-123", createdAt: now, extra: "ignored" },
			{ providerId: "github", accountId: "github-456", createdAt: now, extra: "also-ignored" },
		]);

		const ctx = createAccountContext();
		const result = await call(accountRouter.getLinkedAccounts, undefined, { context: ctx });

		expect(result).toEqual([
			{ providerId: "google", accountId: "google-123", createdAt: now },
			{ providerId: "github", accountId: "github-456", createdAt: now },
		]);
	});

	it("returns empty array when auth throws", async () => {
		mockAuth.api.listUserAccounts.mockRejectedValueOnce(new Error("Auth service unavailable"));

		const ctx = createAccountContext();
		const result = await call(accountRouter.getLinkedAccounts, undefined, { context: ctx });

		expect(result).toEqual([]);
	});
});
