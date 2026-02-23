import { ORPCError, call } from "@orpc/server";
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import {
	makePersonalApiKey,
	KEY_ID,
} from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/personal-api-key-repository");

import {
	createKey,
	listKeysByUserId,
	revokeKey,
} from "@packages/database/repositories/personal-api-key-repository";

// Mock Bun.password.hash since vitest runs in Node, not Bun
const originalBun = (globalThis as any).Bun;
beforeAll(() => {
	(globalThis as any).Bun = {
		...originalBun,
		password: {
			hash: vi.fn().mockResolvedValue("hashed_key_value"),
		},
	};
});
afterAll(() => {
	(globalThis as any).Bun = originalBun;
});

import * as personalApiKeyRouter from "@/integrations/orpc/router/personal-api-key";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// create
// =============================================================================

describe("create", () => {
	const input = {
		label: "My API Key",
		scopes: { content: "write" as const, agent: "read" as const },
		organizationAccess: "all" as const,
	};

	it("generates key, hashes it, stores in DB, and returns plaintext key", async () => {
		const created = makePersonalApiKey();
		vi.mocked(createKey).mockResolvedValueOnce(created);

		const ctx = createTestContext();
		const result = await call(personalApiKeyRouter.create, input, {
			context: ctx,
		});

		// Should have called createKey with hashed value and correct userId
		expect(createKey).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				userId: TEST_USER_ID,
				label: input.label,
				keyHash: "hashed_key_value",
				keyPrefix: expect.any(String),
				scopes: input.scopes,
				organizationAccess: input.organizationAccess,
			}),
		);

		// Should return id, label, keyPrefix, plaintextKey, createdAt
		expect(result).toEqual(
			expect.objectContaining({
				id: KEY_ID,
				label: "My API Key",
				keyPrefix: "AbCdEfGh",
				createdAt: created.createdAt,
			}),
		);
		expect(result.plaintextKey).toBeDefined();
	});

	it("returns a plaintext key starting with 'cta_' prefix", async () => {
		const created = makePersonalApiKey();
		vi.mocked(createKey).mockResolvedValueOnce(created);

		const ctx = createTestContext();
		const result = await call(personalApiKeyRouter.create, input, {
			context: ctx,
		});

		expect(result.plaintextKey).toMatch(/^cta_/);
		// cta_ (4 chars) + 40 random chars = 44 total
		expect(result.plaintextKey).toHaveLength(44);
	});
});

// =============================================================================
// list
// =============================================================================

describe("list", () => {
	it("returns masked keys list with 'cta_{prefix}...' format", async () => {
		const keys = [
			makePersonalApiKey({ keyPrefix: "AbCdEfGh" }),
			makePersonalApiKey({ id: "key-2", keyPrefix: "XyZwVuTs", label: "Second Key" }),
		];
		vi.mocked(listKeysByUserId).mockResolvedValueOnce(keys);

		const ctx = createTestContext();
		const result = await call(personalApiKeyRouter.list, undefined, {
			context: ctx,
		});

		expect(listKeysByUserId).toHaveBeenCalledWith(
			expect.anything(),
			TEST_USER_ID,
		);
		expect(result).toHaveLength(2);
		expect(result[0].maskedKey).toBe("cta_AbCdEfGh...");
		expect(result[1].maskedKey).toBe("cta_XyZwVuTs...");
		// Should NOT expose keyHash
		expect(result[0]).not.toHaveProperty("keyHash");
	});

	it("returns empty array when no keys exist", async () => {
		vi.mocked(listKeysByUserId).mockResolvedValueOnce([]);

		const ctx = createTestContext();
		const result = await call(personalApiKeyRouter.list, undefined, {
			context: ctx,
		});

		expect(result).toEqual([]);
	});
});

// =============================================================================
// revoke
// =============================================================================

describe("revoke", () => {
	it("deletes key and returns success", async () => {
		vi.mocked(revokeKey).mockResolvedValueOnce(makePersonalApiKey());

		const ctx = createTestContext();
		const result = await call(
			personalApiKeyRouter.revoke,
			{ id: KEY_ID },
			{ context: ctx },
		);

		expect(revokeKey).toHaveBeenCalledWith(
			expect.anything(),
			KEY_ID,
			TEST_USER_ID,
		);
		expect(result).toEqual({ success: true });
	});

	it("throws NOT_FOUND when key does not exist or wrong owner", async () => {
		vi.mocked(revokeKey).mockResolvedValueOnce(null as any);

		const ctx = createTestContext();
		await expect(
			call(personalApiKeyRouter.revoke, { id: KEY_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// getScopeDefinitions
// =============================================================================

describe("getScopeDefinitions", () => {
	it("returns scope definitions with resource, label, and description", async () => {
		const ctx = createTestContext();
		const result = await call(
			personalApiKeyRouter.getScopeDefinitions,
			undefined,
			{ context: ctx },
		);

		expect(result.definitions).toBeInstanceOf(Array);
		expect(result.definitions.length).toBeGreaterThan(0);

		// Each definition has resource, label, description
		for (const def of result.definitions) {
			expect(def).toHaveProperty("resource");
			expect(def).toHaveProperty("label");
			expect(def).toHaveProperty("description");
			expect(typeof def.resource).toBe("string");
			expect(typeof def.label).toBe("string");
			expect(typeof def.description).toBe("string");
		}

		// Verify known resources are included
		const resources = result.definitions.map((d) => d.resource);
		expect(resources).toContain("content");
		expect(resources).toContain("agent");
		expect(resources).toContain("brand");
		expect(resources).toContain("webhook");
	});

	it("returns presets with id, label, description, and scopes", async () => {
		const ctx = createTestContext();
		const result = await call(
			personalApiKeyRouter.getScopeDefinitions,
			undefined,
			{ context: ctx },
		);

		expect(result.presets).toBeInstanceOf(Array);
		expect(result.presets.length).toBeGreaterThan(0);

		// Each preset has id, label, description, scopes
		for (const preset of result.presets) {
			expect(preset).toHaveProperty("id");
			expect(preset).toHaveProperty("label");
			expect(preset).toHaveProperty("description");
			expect(preset).toHaveProperty("scopes");
			expect(typeof preset.id).toBe("string");
			expect(typeof preset.scopes).toBe("object");
		}

		// Verify known presets exist
		const presetIds = result.presets.map((p) => p.id);
		expect(presetIds).toContain("full_access");
		expect(presetIds).toContain("read_only");
		expect(presetIds).toContain("content_sdk");
	});
});
