import { ORPCError, call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_TEAM_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import { INSIGHT_ID, makeInsight } from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/insight-repository");
vi.mock("@packages/events/insight");

import {
	createInsight,
	deleteInsight,
	getInsightById,
	listInsights,
	updateInsight,
} from "@packages/database/repositories/insight-repository";
import {
	emitInsightCreated,
	emitInsightDeleted,
	emitInsightUpdated,
} from "@packages/events/insight";

import * as insightsRouter from "@/integrations/orpc/router/insights";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(emitInsightCreated).mockResolvedValue(undefined);
	vi.mocked(emitInsightUpdated).mockResolvedValue(undefined);
	vi.mocked(emitInsightDeleted).mockResolvedValue(undefined);
});

// =============================================================================
// create
// =============================================================================

describe("create", () => {
	const input = {
		name: "My Insight",
		description: "Test insight",
		type: "trends" as const,
		config: { metric: "pageViews" },
	};

	it("creates insight and returns data", async () => {
		const insight = makeInsight();
		vi.mocked(createInsight).mockResolvedValueOnce(insight);

		const ctx = createTestContext();
		const result = await call(insightsRouter.create, input, {
			context: ctx,
		});

		expect(createInsight).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				createdBy: TEST_USER_ID,
				name: input.name,
				description: input.description,
				type: input.type,
				config: input.config,
			}),
		);
		expect(result).toEqual(insight);
	});

	it("emits insight.created event with correct params including teamId", async () => {
		const insight = makeInsight();
		vi.mocked(createInsight).mockResolvedValueOnce(insight);

		const ctx = createTestContext();
		await call(insightsRouter.create, input, { context: ctx });

		expect(emitInsightCreated).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				insightId: INSIGHT_ID,
				name: input.name,
			}),
		);
	});
});

// =============================================================================
// list
// =============================================================================

describe("list", () => {
	it("returns list of insights", async () => {
		const insights = [
			makeInsight(),
			makeInsight({ id: "insight-2", name: "Second Insight" }),
		];
		vi.mocked(listInsights).mockResolvedValueOnce(insights);

		const ctx = createTestContext();
		const result = await call(insightsRouter.list, undefined, {
			context: ctx,
		});

		expect(listInsights).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
			undefined,
		);
		expect(result).toHaveLength(2);
	});

	it("passes type filter when provided", async () => {
		vi.mocked(listInsights).mockResolvedValueOnce([]);

		const ctx = createTestContext();
		await call(insightsRouter.list, { type: "funnels" }, { context: ctx });

		expect(listInsights).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
			"funnels",
		);
	});
});

// =============================================================================
// getById
// =============================================================================

describe("getById", () => {
	it("returns insight by id", async () => {
		const insight = makeInsight();
		vi.mocked(getInsightById).mockResolvedValueOnce(insight);

		const ctx = createTestContext();
		const result = await call(
			insightsRouter.getById,
			{ id: INSIGHT_ID },
			{ context: ctx },
		);

		expect(getInsightById).toHaveBeenCalledWith(
			expect.anything(),
			INSIGHT_ID,
		);
		expect(result).toEqual(insight);
	});

	it("throws NOT_FOUND when insight does not exist", async () => {
		vi.mocked(getInsightById).mockResolvedValueOnce(null);

		const ctx = createTestContext();
		await expect(
			call(
				insightsRouter.getById,
				{ id: INSIGHT_ID },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: ORPCError) => e.code === "NOT_FOUND");
	});

	it("throws NOT_FOUND when insight belongs to different org", async () => {
		const insight = makeInsight({ organizationId: "other-org-id" });
		vi.mocked(getInsightById).mockResolvedValueOnce(insight);

		const ctx = createTestContext();
		await expect(
			call(
				insightsRouter.getById,
				{ id: INSIGHT_ID },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: ORPCError) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// update
// =============================================================================

describe("update", () => {
	const input = {
		id: INSIGHT_ID,
		name: "Updated Insight",
		description: "Updated description",
	};

	it("updates insight successfully and emits event with changedFields", async () => {
		vi.mocked(getInsightById).mockResolvedValueOnce(
			makeInsight(),
		);
		const updated = makeInsight({
			name: "Updated Insight",
			description: "Updated description",
		});
		vi.mocked(updateInsight).mockResolvedValueOnce(updated);

		const ctx = createTestContext();
		const result = await call(insightsRouter.update, input, {
			context: ctx,
		});

		expect(updateInsight).toHaveBeenCalledWith(
			expect.anything(),
			INSIGHT_ID,
			expect.objectContaining({
				name: "Updated Insight",
				description: "Updated description",
			}),
		);
		expect(result).toEqual(updated);

		expect(emitInsightUpdated).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				insightId: INSIGHT_ID,
				changedFields: expect.arrayContaining([
					"name",
					"description",
				]),
			}),
		);
	});

	it("throws NOT_FOUND when insight does not exist", async () => {
		vi.mocked(getInsightById).mockResolvedValueOnce(null);

		const ctx = createTestContext();
		await expect(
			call(insightsRouter.update, input, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// remove
// =============================================================================

describe("remove", () => {
	it("deletes insight and emits event", async () => {
		vi.mocked(getInsightById).mockResolvedValueOnce(
			makeInsight(),
		);
		vi.mocked(deleteInsight).mockResolvedValueOnce(undefined);

		const ctx = createTestContext();
		const result = await call(
			insightsRouter.remove,
			{ id: INSIGHT_ID },
			{ context: ctx },
		);

		expect(deleteInsight).toHaveBeenCalledWith(
			expect.anything(),
			INSIGHT_ID,
		);
		expect(result).toEqual({ success: true });

		expect(emitInsightDeleted).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				insightId: INSIGHT_ID,
			}),
		);
	});

	it("throws NOT_FOUND when insight does not exist", async () => {
		vi.mocked(getInsightById).mockResolvedValueOnce(null);

		const ctx = createTestContext();
		await expect(
			call(
				insightsRouter.remove,
				{ id: INSIGHT_ID },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: ORPCError) => e.code === "NOT_FOUND");
	});
});
