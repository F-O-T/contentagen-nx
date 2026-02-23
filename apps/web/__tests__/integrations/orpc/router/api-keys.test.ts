import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	createTestContext,
} from "../../../helpers/create-test-context";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = {
	api: {
		listApiKeys: vi.fn(),
		getApiKey: vi.fn(),
	},
};

import * as apiKeysRouter from "@/integrations/orpc/router/api-keys";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createApiKeysContext(overrides = {}) {
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
// list
// =============================================================================

describe("list", () => {
	it("returns only keys matching current organization", async () => {
		const allKeys = [
			{
				id: "key-1",
				name: "My Key",
				metadata: { organizationId: TEST_ORG_ID },
			},
			{
				id: "key-2",
				name: "Other Org Key",
				metadata: { organizationId: "other-org-id" },
			},
			{
				id: "key-3",
				name: "Another Key",
				metadata: { organizationId: TEST_ORG_ID },
			},
		];
		mockAuth.api.listApiKeys.mockResolvedValueOnce(allKeys);

		const ctx = createApiKeysContext();
		const result = await call(apiKeysRouter.list, undefined, {
			context: ctx,
		});

		expect(result).toHaveLength(2);
		expect(result).toEqual([
			{
				id: "key-1",
				name: "My Key",
				metadata: { organizationId: TEST_ORG_ID },
			},
			{
				id: "key-3",
				name: "Another Key",
				metadata: { organizationId: TEST_ORG_ID },
			},
		]);
		expect(mockAuth.api.listApiKeys).toHaveBeenCalledWith({
			headers: ctx.headers,
		});
	});

	it("returns empty array when no keys match", async () => {
		const allKeys = [
			{
				id: "key-1",
				name: "Other Key",
				metadata: { organizationId: "other-org-id" },
			},
		];
		mockAuth.api.listApiKeys.mockResolvedValueOnce(allKeys);

		const ctx = createApiKeysContext();
		const result = await call(apiKeysRouter.list, undefined, {
			context: ctx,
		});

		expect(result).toEqual([]);
	});
});

// =============================================================================
// get
// =============================================================================

describe("get", () => {
	it("returns key when it belongs to the current organization", async () => {
		const key = {
			id: "key-1",
			name: "My Key",
			metadata: { organizationId: TEST_ORG_ID },
		};
		mockAuth.api.getApiKey.mockResolvedValueOnce(key);

		const ctx = createApiKeysContext();
		const result = await call(
			apiKeysRouter.get,
			{ keyId: "key-1" },
			{ context: ctx },
		);

		expect(result).toEqual(key);
		expect(mockAuth.api.getApiKey).toHaveBeenCalledWith({
			query: { id: "key-1" },
			headers: ctx.headers,
		});
	});

	it("throws FORBIDDEN when key belongs to a different organization", async () => {
		const key = {
			id: "key-1",
			name: "Other Org Key",
			metadata: { organizationId: "other-org-id" },
		};
		mockAuth.api.getApiKey.mockResolvedValueOnce(key);

		const ctx = createApiKeysContext();
		await expect(
			call(apiKeysRouter.get, { keyId: "key-1" }, { context: ctx }),
		).rejects.toThrow(
			expect.objectContaining({
				code: "FORBIDDEN",
			}),
		);
	});
});
