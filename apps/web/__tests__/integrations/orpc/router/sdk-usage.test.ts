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

vi.mock("@packages/posthog/analytics/sdk-usage-query");

import {
	querySDKUsage,
	querySDKUsageByMonth,
} from "@packages/posthog/analytics/sdk-usage-query";

import * as sdkUsageRouter from "@/integrations/orpc/router/sdk-usage";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// getSDKUsage
// =============================================================================

describe("getSDKUsage", () => {
	it("passes organizationId and dates to querySDKUsage", async () => {
		const mockResult = {
			totalRequests: 1500,
			uniqueKeys: 3,
		};
		vi.mocked(querySDKUsage).mockResolvedValueOnce(mockResult);

		const startDate = new Date("2026-01-01");
		const endDate = new Date("2026-01-31");

		const ctx = createTestContext();
		const result = await call(
			sdkUsageRouter.getSDKUsage,
			{ startDate, endDate },
			{ context: ctx },
		);

		expect(querySDKUsage).toHaveBeenCalledWith({
			organizationId: TEST_ORG_ID,
			startDate,
			endDate,
		});
		expect(result).toEqual(mockResult);
	});
});

// =============================================================================
// getCurrentMonthSDKUsage
// =============================================================================

describe("getCurrentMonthSDKUsage", () => {
	it("auto-calculates current month dates and passes organizationId", async () => {
		const mockResult = {
			totalRequests: 800,
			uniqueKeys: 2,
		};
		vi.mocked(querySDKUsage).mockResolvedValueOnce(mockResult);

		const ctx = createTestContext();
		const result = await call(
			sdkUsageRouter.getCurrentMonthSDKUsage,
			undefined,
			{ context: ctx },
		);

		expect(querySDKUsage).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
			}),
		);

		// Verify the auto-calculated dates are for the current month
		const calledWith = vi.mocked(querySDKUsage).mock.calls[0][0];
		const now = new Date();
		expect(calledWith.startDate.getFullYear()).toBe(now.getFullYear());
		expect(calledWith.startDate.getMonth()).toBe(now.getMonth());
		expect(calledWith.startDate.getDate()).toBe(1);
		expect(calledWith.endDate.getMonth()).toBe(now.getMonth());

		expect(result).toEqual(mockResult);
	});
});

// =============================================================================
// getSDKUsageByMonth
// =============================================================================

describe("getSDKUsageByMonth", () => {
	it("passes organizationId and dates to querySDKUsageByMonth", async () => {
		const mockResult = [
			{ month: "2026-01", requests: 1200 },
			{ month: "2025-12", requests: 900 },
		];
		vi.mocked(querySDKUsageByMonth).mockResolvedValueOnce(mockResult);

		const startDate = new Date("2025-12-01");
		const endDate = new Date("2026-01-31");

		const ctx = createTestContext();
		const result = await call(
			sdkUsageRouter.getSDKUsageByMonth,
			{ startDate, endDate },
			{ context: ctx },
		);

		expect(querySDKUsageByMonth).toHaveBeenCalledWith({
			organizationId: TEST_ORG_ID,
			startDate,
			endDate,
		});
		expect(result).toEqual(mockResult);
	});
});
