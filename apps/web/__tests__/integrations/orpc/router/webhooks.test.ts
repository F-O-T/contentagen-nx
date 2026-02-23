import { ORPCError, call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_TEAM_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import {
	ENDPOINT_ID,
	makeWebhookEndpoint,
} from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/webhook-repository");
vi.mock("@packages/database/repositories/event-catalog-repository");
vi.mock("@packages/events/webhook");

import {
	createWebhookEndpoint,
	deleteWebhookEndpoint,
	getWebhookDeliveries,
	getWebhookEndpoint,
	listWebhookEndpoints,
	updateWebhookEndpoint,
} from "@packages/database/repositories/webhook-repository";
import { listEventCatalog } from "@packages/database/repositories/event-catalog-repository";
import {
	emitWebhookEndpointCreated,
	emitWebhookEndpointDeleted,
	emitWebhookEndpointUpdated,
} from "@packages/events/webhook";

import * as webhooksRouter from "@/integrations/orpc/router/webhooks";

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
		eventPatterns: ["content.page.published"],
	};
	const catalogEntry = {
		id: "event-1",
		eventName: "content.page.published",
		category: "content",
		displayName: "Page published",
		description: null,
		pricePerEvent: "0",
		freeTierLimit: 0,
		isBillable: false,
		isActive: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	};

	it("creates webhook endpoint successfully", async () => {
		const endpoint = makeWebhookEndpoint({
			signingSecret: "cta_wh_1234567890",
			apiKeyId: "api-key-1",
			eventPatterns: ["content.page.published"],
		});
		vi.mocked(createWebhookEndpoint).mockResolvedValueOnce(endpoint);
		vi.mocked(listEventCatalog).mockResolvedValueOnce([catalogEntry]);
		const createApiKey = vi.fn().mockResolvedValue({
			id: "api-key-1",
			key: "cta_wh_1234567890",
		});

		const ctx = createTestContext({
			auth: { api: { createApiKey } },
		});
		const result = await call(webhooksRouter.create, input, { context: ctx });

		expect(listEventCatalog).toHaveBeenCalledWith(expect.anything());
		expect(createApiKey).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: expect.any(Headers),
				body: expect.objectContaining({
					name: expect.stringContaining("Webhook"),
					prefix: "cta_wh",
					userId: TEST_USER_ID,
					metadata: expect.objectContaining({
						organizationId: TEST_ORG_ID,
						teamId: TEST_TEAM_ID,
						type: "webhook",
					}),
				}),
			}),
		);
		expect(createWebhookEndpoint).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				teamId: TEST_TEAM_ID,
				url: input.url,
				description: input.description,
				eventPatterns: input.eventPatterns,
				apiKeyId: "api-key-1",
				signingSecret: "cta_wh_1234567890",
			}),
		);
		expect(result).toEqual(
			expect.objectContaining({
				endpoint: expect.objectContaining({
					signingSecret: "cta_wh_1...",
				}),
				plaintextSecret: "cta_wh_1234567890",
			}),
		);
	});

	it("rejects wildcard event patterns", async () => {
		vi.mocked(listEventCatalog).mockResolvedValueOnce([catalogEntry]);
		const ctx = createTestContext({
			auth: { api: { createApiKey: vi.fn() } },
		});

		await expect(
			call(
				webhooksRouter.create,
				{
					...input,
					eventPatterns: ["content.*"],
				},
				{ context: ctx },
			),
		).rejects.toSatisfy(
			(e: ORPCError<any, any>) => e.code === "BAD_REQUEST",
		);
	});

	it("rejects single wildcard pattern", async () => {
		vi.mocked(listEventCatalog).mockResolvedValueOnce([catalogEntry]);
		const ctx = createTestContext({
			auth: { api: { createApiKey: vi.fn() } },
		});

		await expect(
			call(
				webhooksRouter.create,
				{
					...input,
					eventPatterns: ["*"],
				},
				{ context: ctx },
			),
		).rejects.toSatisfy(
			(e: ORPCError<any, any>) => e.code === "BAD_REQUEST",
		);
	});

	it("rejects events not in catalog", async () => {
		vi.mocked(listEventCatalog).mockResolvedValueOnce([catalogEntry]);
		const ctx = createTestContext({
			auth: { api: { createApiKey: vi.fn() } },
		});

		await expect(
			call(
				webhooksRouter.create,
				{
					...input,
					eventPatterns: ["content.page.deleted"],
				},
				{ context: ctx },
			),
		).rejects.toSatisfy(
			(e: ORPCError<any, any>) => e.code === "BAD_REQUEST",
		);
	});

	it("returns masked secret in endpoint object", async () => {
		const endpoint = makeWebhookEndpoint({
			signingSecret: "cta_wh_1234567890",
			apiKeyId: "api-key-1",
			eventPatterns: ["content.page.published"],
		});
		vi.mocked(createWebhookEndpoint).mockResolvedValueOnce(endpoint);
		vi.mocked(listEventCatalog).mockResolvedValueOnce([catalogEntry]);

		const ctx = createTestContext({
			auth: {
				api: {
					createApiKey: vi
						.fn()
						.mockResolvedValue({ id: "api-key-1", key: "cta_wh_1234567890" }),
				},
			},
		});
		const result = await call(webhooksRouter.create, input, { context: ctx });

		expect(result.endpoint.signingSecret).toBe("cta_wh_1...");
		expect(result.plaintextSecret).toBe("cta_wh_1234567890");
		expect(result.endpoint.signingSecret).not.toBe(result.plaintextSecret);
	});

	it("emits webhookEndpointCreated event with teamId", async () => {
		const endpoint = makeWebhookEndpoint();
		vi.mocked(createWebhookEndpoint).mockResolvedValueOnce(endpoint);
		vi.mocked(listEventCatalog).mockResolvedValueOnce([catalogEntry]);

		const ctx = createTestContext({
			auth: { api: { createApiKey: vi.fn().mockResolvedValue({ id: "api-key-1", key: "cta_wh_1234567890" }) } },
		});
		await call(webhooksRouter.create, input, { context: ctx });

		expect(emitWebhookEndpointCreated).toHaveBeenCalledWith(
			expect.any(Function),
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
		const endpoint = makeWebhookEndpoint({
			signingSecret: "cta_wh_1234567890",
			apiKeyId: "api-key-1",
			eventPatterns: ["content.page.published"],
		});
		vi.mocked(createWebhookEndpoint).mockResolvedValueOnce(endpoint);
		vi.mocked(listEventCatalog).mockResolvedValueOnce([catalogEntry]);
		vi.mocked(emitWebhookEndpointCreated).mockRejectedValueOnce(
			new Error("emit failed"),
		);

		const ctx = createTestContext({
			auth: { api: { createApiKey: vi.fn().mockResolvedValue({ id: "api-key-1", key: "cta_wh_1234567890" }) } },
		});
		const result = await call(webhooksRouter.create, input, { context: ctx });

		expect(result).toEqual(
			expect.objectContaining({
				endpoint: expect.objectContaining({
					signingSecret: "cta_wh_1...",
				}),
				plaintextSecret: "cta_wh_1234567890",
			}),
		);
	});
});

// =============================================================================
// list
// =============================================================================

describe("list", () => {
	it("returns endpoints with masked signing secrets", async () => {
		const endpoints = [
			makeWebhookEndpoint(),
			makeWebhookEndpoint({ id: "endpoint-2", url: "https://example.com/webhook2" }),
		];
		vi.mocked(listWebhookEndpoints).mockResolvedValueOnce(endpoints);

		const ctx = createTestContext();
		const result = await call(webhooksRouter.list, undefined, { context: ctx });

		expect(listWebhookEndpoints).toHaveBeenCalledWith(
			expect.anything(),
			TEST_TEAM_ID,
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
		const endpoint = makeWebhookEndpoint();
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(endpoint);

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
		).rejects.toSatisfy((e: ORPCError<any, any>) => e.code === "NOT_FOUND");
	});

	it("throws NOT_FOUND when endpoint belongs to different team", async () => {
		const endpoint = {
			...makeWebhookEndpoint(),
			teamId: "other-team-id",
		} as any;
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(endpoint);

		const ctx = createTestContext();
		await expect(
			call(webhooksRouter.getById, { id: ENDPOINT_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<any, any>) => e.code === "NOT_FOUND");
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
	const catalogEntry = {
		id: "event-1",
		eventName: "content.page.published",
		category: "content",
		displayName: "Page published",
		description: null,
		pricePerEvent: "0",
		freeTierLimit: 0,
		isBillable: false,
		isActive: true,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	};

	it("updates endpoint successfully", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeWebhookEndpoint());
		const updated = makeWebhookEndpoint({
			url: "https://example.com/updated-webhook",
			isActive: false,
		});
		vi.mocked(updateWebhookEndpoint).mockResolvedValueOnce(updated);

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

	it("rejects wildcard event patterns", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeWebhookEndpoint());
		vi.mocked(listEventCatalog).mockResolvedValueOnce([catalogEntry]);

		const ctx = createTestContext();
		await expect(
			call(
				webhooksRouter.update,
				{ id: ENDPOINT_ID, eventPatterns: ["content.*"] },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: ORPCError<any, any>) => e.code === "BAD_REQUEST");
	});

	it("rejects single wildcard pattern", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeWebhookEndpoint());
		vi.mocked(listEventCatalog).mockResolvedValueOnce([catalogEntry]);

		const ctx = createTestContext();
		await expect(
			call(
				webhooksRouter.update,
				{ id: ENDPOINT_ID, eventPatterns: ["*"] },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: ORPCError<any, any>) => e.code === "BAD_REQUEST");
	});

	it("rejects events not in catalog", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeWebhookEndpoint());
		vi.mocked(listEventCatalog).mockResolvedValueOnce([catalogEntry]);

		const ctx = createTestContext();
		await expect(
			call(
				webhooksRouter.update,
				{ id: ENDPOINT_ID, eventPatterns: ["content.page.deleted"] },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: ORPCError<any, any>) => e.code === "BAD_REQUEST");
	});

	it("throws NOT_FOUND for different team", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(
			({
				...makeWebhookEndpoint(),
				teamId: "other-team",
			} as any),
		);

		const ctx = createTestContext();
		await expect(
			call(webhooksRouter.update, input, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<any, any>) => e.code === "NOT_FOUND");
	});

	it("emits webhookEndpointUpdated event with changedFields", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeWebhookEndpoint());
		vi.mocked(updateWebhookEndpoint).mockResolvedValueOnce(
			makeWebhookEndpoint(),
		);

		const ctx = createTestContext();
		await call(webhooksRouter.update, input, { context: ctx });

		expect(emitWebhookEndpointUpdated).toHaveBeenCalledWith(
			expect.any(Function),
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
		const endpoint = {
			...makeWebhookEndpoint(),
			apiKeyId: "api-key-123",
		} as any;
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(endpoint);
		vi.mocked(deleteWebhookEndpoint).mockResolvedValueOnce(undefined);
		const deleteApiKey = vi.fn().mockResolvedValue(undefined);

		const ctx = createTestContext({
			auth: { api: { deleteApiKey } },
		});
		const result = await call(
			webhooksRouter.remove,
			{ id: ENDPOINT_ID },
			{ context: ctx },
		);

		expect(deleteApiKey).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: expect.any(Headers),
				body: { keyId: "api-key-123" },
			}),
		);
		expect(deleteWebhookEndpoint).toHaveBeenCalledWith(
			expect.anything(),
			ENDPOINT_ID,
		);
		expect(result).toEqual({ success: true });
	});

	it("emits webhookEndpointDeleted event", async () => {
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeWebhookEndpoint());
		vi.mocked(deleteWebhookEndpoint).mockResolvedValueOnce(undefined);

		const ctx = createTestContext({
			auth: { api: { deleteApiKey: vi.fn().mockResolvedValue(undefined) } },
		});
		await call(
			webhooksRouter.remove,
			{ id: ENDPOINT_ID },
			{ context: ctx },
		);

		expect(emitWebhookEndpointDeleted).toHaveBeenCalledWith(
			expect.any(Function),
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
		vi.mocked(getWebhookEndpoint).mockResolvedValueOnce(makeWebhookEndpoint());
		const mockDeliveries = [
			{
				id: "delivery-1",
				webhookEndpointId: ENDPOINT_ID,
				eventId: "event-1",
				url: "https://example.com/webhook",
				eventName: "content.page.published",
				payload: { id: "payload-1" },
				status: "delivered",
				httpStatusCode: 200,
				responseBody: "ok",
				errorMessage: null,
				attemptNumber: 1,
				maxAttempts: 5,
				nextRetryAt: null,
				createdAt: new Date("2026-01-02"),
				deliveredAt: new Date("2026-01-02"),
			},
			{
				id: "delivery-2",
				webhookEndpointId: ENDPOINT_ID,
				eventId: "event-2",
				url: "https://example.com/webhook",
				eventName: "content.page.updated",
				payload: { id: "payload-2" },
				status: "failed",
				httpStatusCode: 500,
				responseBody: "error",
				errorMessage: "failed",
				attemptNumber: 2,
				maxAttempts: 5,
				nextRetryAt: new Date("2026-01-03"),
				createdAt: new Date("2026-01-02"),
				deliveredAt: null,
			},
		];
		vi.mocked(getWebhookDeliveries).mockResolvedValueOnce(
			mockDeliveries,
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
