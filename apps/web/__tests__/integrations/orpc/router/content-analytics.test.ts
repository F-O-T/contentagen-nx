import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	createTestContext,
} from "../../../helpers/create-test-context";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/environment/server", () => ({
	env: {
		POSTHOG_HOST: "http://localhost:8000",
		POSTHOG_KEY: "test-key",
		POSTHOG_PROJECT_ID: "1",
		POSTHOG_PERSONAL_API_KEY: "test-personal-key",
	},
}));

vi.mock("@packages/posthog/analytics/content-analytics-query");

import {
	queryContentAnalytics,
	queryTopContent,
	queryTrafficSources,
	queryEngagementFunnel,
} from "@packages/posthog/analytics/content-analytics-query";

import * as contentAnalyticsRouter from "@/integrations/orpc/router/content-analytics";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_ID = "a0a0a0a0-b1b1-4c2c-9d3d-e4e4e4e4e4e4";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// getContentAnalytics
// =============================================================================

describe("getContentAnalytics", () => {
	it("passes correct params including organizationId and returns result", async () => {
		const mockResult = {
			timeSeries: [{ date: "2026-01-01", views: 100, engagement: 50 }],
		};
		vi.mocked(queryContentAnalytics).mockResolvedValueOnce(mockResult);

		const startDate = new Date("2026-01-01");
		const endDate = new Date("2026-01-31");

		const ctx = createTestContext();
		const result = await call(
			contentAnalyticsRouter.getContentAnalytics,
			{
				contentId: CONTENT_ID,
				startDate,
				endDate,
				granularity: "weekly",
			},
			{ context: ctx },
		);

		expect(queryContentAnalytics).toHaveBeenCalledWith({
			organizationId: TEST_ORG_ID,
			contentId: CONTENT_ID,
			startDate,
			endDate,
			granularity: "weekly",
		});
		expect(result).toEqual(mockResult);
	});
});

// =============================================================================
// getCurrentMonthContentAnalytics
// =============================================================================

describe("getCurrentMonthContentAnalytics", () => {
	it("auto-calculates current month dates and passes organizationId", async () => {
		const mockResult = {
			timeSeries: [{ date: "2026-02-01", views: 200 }],
		};
		vi.mocked(queryContentAnalytics).mockResolvedValueOnce(mockResult);

		const ctx = createTestContext();
		const result = await call(
			contentAnalyticsRouter.getCurrentMonthContentAnalytics,
			{ contentId: CONTENT_ID },
			{ context: ctx },
		);

		expect(queryContentAnalytics).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				contentId: CONTENT_ID,
				granularity: "daily",
			}),
		);

		// Verify the auto-calculated dates are for the current month
		const calledWith = vi.mocked(queryContentAnalytics).mock.calls[0][0];
		const now = new Date();
		expect(calledWith.startDate.getFullYear()).toBe(now.getFullYear());
		expect(calledWith.startDate.getMonth()).toBe(now.getMonth());
		expect(calledWith.startDate.getDate()).toBe(1);
		expect(calledWith.endDate.getMonth()).toBe(now.getMonth());

		expect(result).toEqual(mockResult);
	});
});

// =============================================================================
// getTopContent
// =============================================================================

describe("getTopContent", () => {
	it("passes sortBy, limit, dates, and organizationId", async () => {
		const mockResult = [
			{ contentId: "c1", title: "Top Article", views: 500 },
		];
		vi.mocked(queryTopContent).mockResolvedValueOnce(mockResult);

		const startDate = new Date("2026-01-01");
		const endDate = new Date("2026-01-31");

		const ctx = createTestContext();
		const result = await call(
			contentAnalyticsRouter.getTopContent,
			{
				sortBy: "engagement",
				limit: 5,
				startDate,
				endDate,
			},
			{ context: ctx },
		);

		expect(queryTopContent).toHaveBeenCalledWith({
			organizationId: TEST_ORG_ID,
			sortBy: "engagement",
			limit: 5,
			startDate,
			endDate,
		});
		expect(result).toEqual(mockResult);
	});
});

// =============================================================================
// getTrafficSources
// =============================================================================

describe("getTrafficSources", () => {
	it("passes organizationId and optional contentId with dates", async () => {
		const mockResult = [
			{ source: "google", visits: 300 },
			{ source: "direct", visits: 150 },
		];
		vi.mocked(queryTrafficSources).mockResolvedValueOnce(mockResult);

		const startDate = new Date("2026-01-01");
		const endDate = new Date("2026-01-31");

		const ctx = createTestContext();
		const result = await call(
			contentAnalyticsRouter.getTrafficSources,
			{
				contentId: CONTENT_ID,
				startDate,
				endDate,
			},
			{ context: ctx },
		);

		expect(queryTrafficSources).toHaveBeenCalledWith({
			organizationId: TEST_ORG_ID,
			contentId: CONTENT_ID,
			startDate,
			endDate,
		});
		expect(result).toEqual(mockResult);
	});
});

// =============================================================================
// getEngagementFunnel
// =============================================================================

describe("getEngagementFunnel", () => {
	it("passes contentId and dates with organizationId", async () => {
		const mockResult = {
			steps: [
				{ name: "view", count: 1000 },
				{ name: "scroll", count: 600 },
				{ name: "cta_click", count: 100 },
			],
		};
		vi.mocked(queryEngagementFunnel).mockResolvedValueOnce(mockResult);

		const startDate = new Date("2026-01-01");
		const endDate = new Date("2026-01-31");

		const ctx = createTestContext();
		const result = await call(
			contentAnalyticsRouter.getEngagementFunnel,
			{
				contentId: CONTENT_ID,
				startDate,
				endDate,
			},
			{ context: ctx },
		);

		expect(queryEngagementFunnel).toHaveBeenCalledWith({
			organizationId: TEST_ORG_ID,
			contentId: CONTENT_ID,
			startDate,
			endDate,
		});
		expect(result).toEqual(mockResult);
	});
});
