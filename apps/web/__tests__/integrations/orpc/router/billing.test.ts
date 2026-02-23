import { ORPCError, call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createTestContext,
} from "../../../helpers/create-test-context";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/database/schema", () => ({
	currentMonthUsageByCategory: {
		organizationId: "organizationId",
		eventCategory: "eventCategory",
		eventCount: "eventCount",
		monthToDateCost: "monthToDateCost",
		projectedCost: "projectedCost",
	},
	currentMonthStorageCost: {
		organizationId: "organizationId",
		currentBytes: "currentBytes",
		monthToDateCost: "monthToDateCost",
		projectedCost: "projectedCost",
	},
	currentMonthUsageByEvent: {
		organizationId: "organizationId",
		eventCategory: "eventCategory",
		eventName: "eventName",
		eventCount: "eventCount",
		monthToDateCost: "monthToDateCost",
	},
	dailyUsageByEvent: {
		organizationId: "organizationId",
		date: "date",
		eventCategory: "eventCategory",
		eventCount: "eventCount",
		totalCost: "totalCost",
	},
	eventCatalog: {
		eventName: "eventName",
		category: "category",
		displayName: "displayName",
		description: "description",
		pricePerEvent: "pricePerEvent",
		freeTierLimit: "freeTierLimit",
	},
}));

import * as billingRouter from "@/integrations/orpc/router/billing";

// ---------------------------------------------------------------------------
// Mock Helpers
// ---------------------------------------------------------------------------

const mockStripeClient = {
	invoices: {
		list: vi.fn(),
		createPreview: vi.fn(),
	},
};

const mockWhere = vi.fn();
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

const mockDb = {
	query: {
		user: {
			findFirst: vi.fn(),
		},
	},
	select: mockSelect,
};

function createBillingContext(overrides: Record<string, unknown> = {}) {
	return createTestContext({
		stripeClient: mockStripeClient,
		db: mockDb,
		...overrides,
	});
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	// Reset chained mock defaults
	mockSelect.mockReturnValue({ from: mockFrom });
	mockFrom.mockReturnValue({ where: mockWhere });
});

// =============================================================================
// getInvoices
// =============================================================================

describe("getInvoices", () => {
	it("returns formatted invoice list", async () => {
		mockDb.query.user.findFirst.mockResolvedValueOnce({
			stripeCustomerId: "cus_123",
		});
		mockStripeClient.invoices.list.mockResolvedValueOnce({
			data: [
				{
					id: "inv_1",
					number: "INV-001",
					amount_paid: 2000,
					amount_due: 0,
					currency: "brl",
					status: "paid",
					created: 1700000000,
					period_start: 1699900000,
					period_end: 1700000000,
					invoice_pdf: "https://stripe.com/pdf/inv_1",
					hosted_invoice_url: "https://stripe.com/inv_1",
				},
			],
		});

		const ctx = createBillingContext();
		const result = await call(billingRouter.getInvoices, { limit: 10 }, { context: ctx });

		expect(mockStripeClient.invoices.list).toHaveBeenCalledWith({
			customer: "cus_123",
			limit: 10,
		});
		expect(result).toEqual([
			{
				id: "inv_1",
				number: "INV-001",
				amountPaid: 2000,
				amountDue: 0,
				currency: "brl",
				status: "paid",
				created: 1700000000,
				periodStart: 1699900000,
				periodEnd: 1700000000,
				invoicePdf: "https://stripe.com/pdf/inv_1",
				hostedInvoiceUrl: "https://stripe.com/inv_1",
			},
		]);
	});

	it("returns empty array when user has no stripeCustomerId", async () => {
		mockDb.query.user.findFirst.mockResolvedValueOnce({
			stripeCustomerId: null,
		});

		const ctx = createBillingContext();
		const result = await call(billingRouter.getInvoices, undefined, { context: ctx });

		expect(result).toEqual([]);
		expect(mockStripeClient.invoices.list).not.toHaveBeenCalled();
	});

	it("throws INTERNAL_SERVER_ERROR when stripeClient is not configured", async () => {
		const ctx = createBillingContext({ stripeClient: undefined });

		await expect(
			call(billingRouter.getInvoices, undefined, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "INTERNAL_SERVER_ERROR");
	});
});

// =============================================================================
// getUpcomingInvoice
// =============================================================================

describe("getUpcomingInvoice", () => {
	it("returns formatted upcoming invoice", async () => {
		mockDb.query.user.findFirst.mockResolvedValueOnce({
			stripeCustomerId: "cus_123",
		});
		mockStripeClient.invoices.createPreview.mockResolvedValueOnce({
			amount_due: 5000,
			currency: "brl",
			period_start: 1700000000,
			period_end: 1702600000,
			next_payment_attempt: 1702600000,
			lines: {
				data: [
					{
						description: "Pro Plan",
						amount: 5000,
						quantity: 1,
					},
				],
			},
		});

		const ctx = createBillingContext();
		const result = await call(billingRouter.getUpcomingInvoice, undefined, { context: ctx });

		expect(mockStripeClient.invoices.createPreview).toHaveBeenCalledWith({
			customer: "cus_123",
		});
		expect(result).toEqual({
			amountDue: 5000,
			currency: "brl",
			periodStart: 1700000000,
			periodEnd: 1702600000,
			nextPaymentAttempt: 1702600000,
			lines: [
				{
					description: "Pro Plan",
					amount: 5000,
					quantity: 1,
				},
			],
		});
	});

	it("returns null when user has no stripeCustomerId", async () => {
		mockDb.query.user.findFirst.mockResolvedValueOnce({
			stripeCustomerId: null,
		});

		const ctx = createBillingContext();
		const result = await call(billingRouter.getUpcomingInvoice, undefined, { context: ctx });

		expect(result).toBeNull();
		expect(mockStripeClient.invoices.createPreview).not.toHaveBeenCalled();
	});

	it("returns null when Stripe throws (canceled subscription)", async () => {
		mockDb.query.user.findFirst.mockResolvedValueOnce({
			stripeCustomerId: "cus_123",
		});
		mockStripeClient.invoices.createPreview.mockRejectedValueOnce(
			new Error("No upcoming invoices for customer"),
		);

		const ctx = createBillingContext();
		const result = await call(billingRouter.getUpcomingInvoice, undefined, { context: ctx });

		expect(result).toBeNull();
	});
});

// =============================================================================
// getCurrentUsage
// =============================================================================

describe("getCurrentUsage", () => {
	it("returns aggregated usage with monthToDate and projected totals", async () => {
		// getCurrentUsage does Promise.all with two db.select() chains
		// First call: categories, second call: storage
		const mockWhere1 = vi.fn().mockResolvedValueOnce([
			{
				eventCategory: "content",
				eventCount: 100,
				monthToDateCost: "1.50",
				projectedCost: "3.00",
			},
			{
				eventCategory: "ai",
				eventCount: 50,
				monthToDateCost: "2.50",
				projectedCost: "5.00",
			},
		]);
		const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });

		const mockWhere2 = vi.fn().mockResolvedValueOnce([]);
		const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

		mockSelect
			.mockReturnValueOnce({ from: mockFrom1 })
			.mockReturnValueOnce({ from: mockFrom2 });

		const ctx = createBillingContext();
		const result = await call(billingRouter.getCurrentUsage, undefined, { context: ctx });

		expect(result).toEqual({
			monthToDate: 4.0,
			projected: 8.0,
			byCategory: [
				{
					category: "content",
					eventCount: 100,
					monthToDateCost: 1.5,
					projectedCost: 3.0,
				},
				{
					category: "ai",
					eventCount: 50,
					monthToDateCost: 2.5,
					projectedCost: 5.0,
				},
			],
		});
	});

	it("returns zeros when no usage rows", async () => {
		// First call: categories (empty), second call: storage (empty)
		const mockWhere1 = vi.fn().mockResolvedValueOnce([]);
		const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });

		const mockWhere2 = vi.fn().mockResolvedValueOnce([]);
		const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

		mockSelect
			.mockReturnValueOnce({ from: mockFrom1 })
			.mockReturnValueOnce({ from: mockFrom2 });

		const ctx = createBillingContext();
		const result = await call(billingRouter.getCurrentUsage, undefined, { context: ctx });

		expect(result).toEqual({
			monthToDate: 0,
			projected: 0,
			byCategory: [],
		});
	});
});

// =============================================================================
// getCategoryUsage
// =============================================================================

describe("getCategoryUsage", () => {
	it("returns usage rows enriched with catalog metadata", async () => {
		// getCategoryUsage does Promise.all with two db.select() chains.
		// First call returns usage rows, second call returns catalog rows.
		const mockWhere1 = vi.fn().mockResolvedValueOnce([
			{
				eventName: "content.page.published",
				eventCount: 42,
				monthToDateCost: "0.84",
			},
		]);
		const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });

		const mockWhere2 = vi.fn().mockResolvedValueOnce([
			{
				eventName: "content.page.published",
				displayName: "Page Published",
				description: "A content page was published",
				pricePerEvent: "0.02",
				freeTierLimit: 100,
			},
		]);
		const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

		mockSelect
			.mockReturnValueOnce({ from: mockFrom1 })
			.mockReturnValueOnce({ from: mockFrom2 });

		const ctx = createBillingContext();
		const result = await call(
			billingRouter.getCategoryUsage,
			{ category: "content" },
			{ context: ctx },
		);

		expect(result).toEqual([
			{
				eventName: "content.page.published",
				eventCount: 42,
				monthToDateCost: 0.84,
				displayName: "Page Published",
				description: "A content page was published",
				pricePerEvent: 0.02,
				freeTierLimit: 100,
			},
		]);
	});

	it("returns rows with fallback values when catalog entry missing", async () => {
		const mockWhere1 = vi.fn().mockResolvedValueOnce([
			{
				eventName: "content.unknown.event",
				eventCount: 5,
				monthToDateCost: "0.10",
			},
		]);
		const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });

		const mockWhere2 = vi.fn().mockResolvedValueOnce([]);
		const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

		mockSelect
			.mockReturnValueOnce({ from: mockFrom1 })
			.mockReturnValueOnce({ from: mockFrom2 });

		const ctx = createBillingContext();
		const result = await call(
			billingRouter.getCategoryUsage,
			{ category: "content" },
			{ context: ctx },
		);

		expect(result).toEqual([
			{
				eventName: "content.unknown.event",
				eventCount: 5,
				monthToDateCost: 0.1,
				displayName: "content.unknown.event",
				description: null,
				pricePerEvent: null,
				freeTierLimit: 0,
			},
		]);
	});
});

// =============================================================================
// getDailyUsage
// =============================================================================

describe("getDailyUsage", () => {
	it("returns sorted date-aggregated usage", async () => {
		mockWhere.mockResolvedValueOnce([
			{
				date: "2026-02-02",
				eventCategory: "ai",
				eventCount: 10,
				totalCost: "0.50",
			},
			{
				date: "2026-02-01",
				eventCategory: "content",
				eventCount: 20,
				totalCost: "0.40",
			},
			{
				date: "2026-02-01",
				eventCategory: "ai",
				eventCount: 5,
				totalCost: "0.25",
			},
		]);

		const ctx = createBillingContext();
		const result = await call(
			billingRouter.getDailyUsage,
			{ days: 30 },
			{ context: ctx },
		);

		// Should be sorted by date ascending, with 2026-02-01 aggregated
		expect(result).toEqual([
			{
				date: "2026-02-01",
				total: 0.65,
				totalCount: 25,
				byCategory: { content: 0.4, ai: 0.25 },
				countByCategory: { content: 20, ai: 5 },
			},
			{
				date: "2026-02-02",
				total: 0.5,
				totalCount: 10,
				byCategory: { ai: 0.5 },
				countByCategory: { ai: 10 },
			},
		]);
	});

	it("returns empty array when no rows", async () => {
		mockWhere.mockResolvedValueOnce([]);

		const ctx = createBillingContext();
		const result = await call(
			billingRouter.getDailyUsage,
			{ days: 30 },
			{ context: ctx },
		);

		expect(result).toEqual([]);
	});
});
