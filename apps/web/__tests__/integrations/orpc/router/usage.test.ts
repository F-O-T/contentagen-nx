import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	createTestContext,
} from "../../../helpers/create-test-context";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@packages/environment/server", () => ({
	env: {
		POSTHOG_HOST: "http://localhost",
		POSTHOG_KEY: "test-key",
		POSTHOG_PROJECT_ID: "1",
		POSTHOG_PERSONAL_API_KEY: "test-api-key",
	},
}));
vi.mock("@packages/posthog/analytics/usage-query");

import {
	queryAIUsage,
	queryExtendedUsage,
} from "@packages/posthog/analytics/usage-query";

import * as usageRouter from "@/integrations/orpc/router/usage";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// getCurrentMonthUsage
// =============================================================================

describe("getCurrentMonthUsage", () => {
	it("calls queryAIUsage with organizationId and current month dates", async () => {
		const mockResult = { totalTokens: 5000, totalCompletions: 42 };
		vi.mocked(queryAIUsage).mockResolvedValueOnce(mockResult);

		const ctx = createTestContext();
		const result = await call(usageRouter.getCurrentMonthUsage, undefined, {
			context: ctx,
		});

		expect(result).toEqual(mockResult);
		expect(queryAIUsage).toHaveBeenCalledOnce();

		const callArgs = vi.mocked(queryAIUsage).mock.calls[0][0];
		expect(callArgs.organizationId).toBe(TEST_ORG_ID);
		// startDate should be the first day of the current month
		expect(callArgs.startDate.getDate()).toBe(1);
		// endDate should be the last day of the current month
		expect(callArgs.endDate.getHours()).toBe(23);
		expect(callArgs.endDate.getMinutes()).toBe(59);
		expect(callArgs.endDate.getSeconds()).toBe(59);
	});
});

// =============================================================================
// getExtendedUsage
// =============================================================================

describe("getExtendedUsage", () => {
	it("calls queryExtendedUsage with organizationId, current and previous month dates", async () => {
		const mockResult = {
			daily: [],
			acceptanceRate: 0.8,
			currentMonth: { totalTokens: 5000 },
			previousMonth: { totalTokens: 3000 },
		};
		vi.mocked(queryExtendedUsage).mockResolvedValueOnce(mockResult);

		const ctx = createTestContext();
		const result = await call(usageRouter.getExtendedUsage, undefined, {
			context: ctx,
		});

		expect(result).toEqual(mockResult);
		expect(queryExtendedUsage).toHaveBeenCalledOnce();

		const callArgs = vi.mocked(queryExtendedUsage).mock.calls[0][0];
		expect(callArgs.organizationId).toBe(TEST_ORG_ID);

		// Current month dates
		expect(callArgs.startDate.getDate()).toBe(1);
		expect(callArgs.endDate.getHours()).toBe(23);
		expect(callArgs.endDate.getMinutes()).toBe(59);

		// Previous month dates
		expect(callArgs.previousMonthStart.getDate()).toBe(1);
		expect(callArgs.previousMonthEnd.getHours()).toBe(23);
		expect(callArgs.previousMonthEnd.getMinutes()).toBe(59);

		// Previous month should be before current month
		expect(callArgs.previousMonthStart.getTime()).toBeLessThan(
			callArgs.startDate.getTime(),
		);
		expect(callArgs.previousMonthEnd.getTime()).toBeLessThan(
			callArgs.endDate.getTime(),
		);
	});
});
