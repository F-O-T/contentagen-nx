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

vi.mock("@packages/database/repositories/webhook-repository");
vi.mock("@packages/events/webhook");

import {
	createWebhookEndpoint,
	deleteWebhookEndpoint,
	getWebhookDeliveries,
	getWebhookEndpoint,
	listWebhookEndpoints,
	updateWebhookEndpoint,
} from "@packages/database/repositories/webhook-repository";
import {
	emitWebhookEndpointCreated,
	emitWebhookEndpointDeleted,
	emitWebhookEndpointUpdated,
} from "@packages/events/webhook";

import * as webhooksRouter from "@/integrations/orpc/router/webhooks";

// ---------------------------------------------------------------------------
// Mock Helpers
// ---------------------------------------------------------------------------

const ENDPOINT_ID = "a0a0a0a0-b1b1-4c2c-9d3d-e4e4e4e4e4e4";

function makeEndpoint(overrides: Record<string, unknown> = {}) {
	return {
		id: ENDPOINT_ID,
		organizationId: TEST_ORG_ID,
		url: "https://example.com/webhook",
		signingSecret: "whsec_1234567890abcdef",
		eventPatterns: ["content.*"],
		description: "Test webhook",
		isActive: true,
		createdAt: new Date("2026-01-01"),
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(emitWebhookEndpointCreated).mockResolvedValue(undefined);
	vi.mocked(emitWebhookEndpointUpdated).mockResolvedValue(undefined);
	vi.mocked(emitWebhookEndpointDeleted).mockResolvedValue(undefined);
});

// =============================================================================
// create
// =============================================================================

describe("create", () => {
	const input = {
		url: "https://example.com/webhook",
		description: "Test webhook",
		eventPatterns: ["content.*"],
	};

	it("creates webhook endpoint successfully", async () => {
		const endpoint = makeEndpoint();
		vi.mocked(createWebhookEndpoint).mockResolvedValueOnce(endpoint as any);

		const ctx = createTestContext();
		const result = await call(webhooksRouter.create, input, { context: ctx });

		expect(createWebhookEndpoint).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				url: input.url,
				description: input.description,
				eventPatterns: input.eventPatterns,
			}),
		);
		expect(result).toEqual(endpoint);
	});

	it("emits webhookEndpointCreated event with teamId", async () => {
		const endpoint = makeEndpoint();
		vi.mocked(createWebhookEndpoint).mockResolvedValueOnce(endpoint as any);

		const ctx = createTestContext();
		await call(webhooksRouter.create, input, { context: ctx });

		expect(emitWebhookEndpointCreated).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				endpointId: ENDPOINT_ID,
				url: input.url,
			}),
		);
	});

	it("succeeds even when event emission fails", async () => {
		const endpoint = makeEndpoint();
		vi.mocked(createWebhookEndpoint).mockResolvedValueOnce(endpoint as any);
		vi.mocked(emitWebhookEndpointCreated).mockRejectedValueOnce(
			new Error("emit failed"),
		);

		const ctx = createTestContext();
		const result = await call(webhooksRouter.create, input, { context: ctx });

		expect(result).toEqual(endpoint);
	});
});

// =============================================================================
// list
// =============================================================================

describe("list", () => {
	it("returns endpoints with masked signing secrets", async () => {
		const endpoints = [
			makeEndpoint(),
			makeEndpoint({ id: "endpoint-2", url: "https://example.com/webhook2" }),
		];
		vi.mocked(listWebhookEndpoints).mockResolvedValueOnce(endpoints as any);

		const ctx = createTestContext();
		const result = await call(webhooksRouter.list, undefined, { context: ctx });

		expect(listWebhookEndpoints).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
		);
		expect(result).toHaveLength(2);
		// Signing secret should be masked: first 8 chars + "..."
		expect(result[0].signingSecret).toBe("whsec_12...");
		expect(result[1].signingSecret).toBe("whsec_12...");
	});

	it("returns empty array when no endpoints", async () => {
		vi.mocked(listWebhookEndpoints).mockResolvedValueOnce([]);

		const ctx = createTestContext();
		const result = await call(webhooksRouter.list, undefined, { context: ctx });

		expect(result).toEqual([]);
	});
});

// =============================================================================
// getById
// =============================================================================

describe("getById", () => {
	it("returns endpoint with masked signing secret", async () => {
		const endpoint = makeEndpoint();
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(endpoint as any);

		const ctx = createTestContext();
		const result = await call(
			webhooksRouter.getById,
			{ id: ENDPOINT_ID },
			{ context: ctx },
		);

		expect(getWebhookEndpoint).toHaveBeenCalledWith(
			expect.anything(),
			ENDPOINT_ID,
		);
		expect(result.signingSecret).toBe("whsec_12...");
		expect(result.url).toBe("https://example.com/webhook");
	});

	it("throws NOT_FOUND when endpoint does not exist", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(null as any);

		const ctx = createTestContext();
		await expect(
			call(webhooksRouter.getById, { id: ENDPOINT_ID }, { context: ctx }),
		).rejects.toSatisfy((e: any) => e.code === "NOT_FOUND");
	});

	it("throws NOT_FOUND when endpoint belongs to different org", async () => {
		const endpoint = makeEndpoint({ organizationId: "other-org-id" });
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(endpoint as any);

		const ctx = createTestContext();
		await expect(
			call(webhooksRouter.getById, { id: ENDPOINT_ID }, { context: ctx }),
		).rejects.toSatisfy((e: any) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// update
// =============================================================================

describe("update", () => {
	const input = {
		id: ENDPOINT_ID,
		url: "https://example.com/updated-webhook" as const,
		isActive: false as const,
	};

	it("updates endpoint successfully", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeEndpoint() as any);
		const updated = makeEndpoint({
			url: "https://example.com/updated-webhook",
			isActive: false,
		});
		vi.mocked(updateWebhookEndpoint).mockResolvedValueOnce(updated as any);

		const ctx = createTestContext();
		const result = await call(webhooksRouter.update, input, { context: ctx });

		expect(updateWebhookEndpoint).toHaveBeenCalledWith(
			expect.anything(),
			ENDPOINT_ID,
			expect.objectContaining({
				url: "https://example.com/updated-webhook",
				isActive: false,
			}),
		);
		expect(result).toEqual(updated);
	});

	it("throws NOT_FOUND for different org", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(
			makeEndpoint({ organizationId: "other-org" }) as any,
		);

		const ctx = createTestContext();
		await expect(
			call(webhooksRouter.update, input, { context: ctx }),
		).rejects.toSatisfy((e: any) => e.code === "NOT_FOUND");
	});

	it("emits webhookEndpointUpdated event with changedFields", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeEndpoint() as any);
		vi.mocked(updateWebhookEndpoint).mockResolvedValueOnce(
			makeEndpoint() as any,
		);

		const ctx = createTestContext();
		await call(webhooksRouter.update, input, { context: ctx });

		expect(emitWebhookEndpointUpdated).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				endpointId: ENDPOINT_ID,
				changedFields: expect.arrayContaining(["url", "isActive"]),
			}),
		);
	});
});

// =============================================================================
// remove
// =============================================================================

describe("remove", () => {
	it("deletes endpoint successfully", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeEndpoint() as any);
		vi.mocked(deleteWebhookEndpoint).mockResolvedValueOnce(undefined as any);

		const ctx = createTestContext();
		const result = await call(
			webhooksRouter.remove,
			{ id: ENDPOINT_ID },
			{ context: ctx },
		);

		expect(deleteWebhookEndpoint).toHaveBeenCalledWith(
			expect.anything(),
			ENDPOINT_ID,
		);
		expect(result).toEqual({ success: true });
	});

	it("emits webhookEndpointDeleted event", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeEndpoint() as any);
		vi.mocked(deleteWebhookEndpoint).mockResolvedValueOnce(undefined as any);

		const ctx = createTestContext();
		await call(
			webhooksRouter.remove,
			{ id: ENDPOINT_ID },
			{ context: ctx },
		);

		expect(emitWebhookEndpointDeleted).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				endpointId: ENDPOINT_ID,
			}),
		);
	});
});

// =============================================================================
// deliveries
// =============================================================================

describe("deliveries", () => {
	it("returns deliveries for valid endpoint with pagination", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeEndpoint() as any);
		const mockDeliveries = [
			{
				id: "delivery-1",
				webhookEndpointId: ENDPOINT_ID,
				eventName: "content.page.published",
				status: "delivered",
			},
			{
				id: "delivery-2",
				webhookEndpointId: ENDPOINT_ID,
				eventName: "content.page.updated",
				status: "failed",
			},
		];
		vi.mocked(getWebhookDeliveries).mockResolvedValueOnce(
			mockDeliveries as any,
		);

		const ctx = createTestContext();
		const result = await call(
			webhooksRouter.deliveries,
			{ webhookId: ENDPOINT_ID, page: 1, limit: 50 },
			{ context: ctx },
		);

		expect(getWebhookEndpoint).toHaveBeenCalledWith(
			expect.anything(),
			ENDPOINT_ID,
		);
		expect(getWebhookDeliveries).toHaveBeenCalledWith(
			expect.anything(),
			ENDPOINT_ID,
			{ offset: 0, limit: 50 },
		);
		expect(result).toEqual({
			items: mockDeliveries,
			page: 1,
			limit: 50,
		});
	});
});
