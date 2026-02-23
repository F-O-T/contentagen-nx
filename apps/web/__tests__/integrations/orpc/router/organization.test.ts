import { ORPCError, call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_USER_ID,
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
vi.mock("@packages/database/repositories/auth-repository");
vi.mock("@packages/events/credits");
vi.mock("@packages/database/schemas/auth", () => ({
	member: { userId: "userId", organizationId: "organizationId", role: "role" },
	organization: { id: "id", name: "name", slug: "slug", logo: "logo" },
}));
vi.mock("@packages/stripe/constants", () => ({
	PlanName: { FREE: "free", LITE: "lite", PRO: "pro" },
	getEffectiveProjectLimit: vi.fn().mockReturnValue(5),
}));

import { resolveOrganizationPlan } from "@packages/events/credits";
import { getEffectiveProjectLimit } from "@packages/stripe/constants";

import * as orgRouter from "@/integrations/orpc/router/organization";

// ---------------------------------------------------------------------------
// Mock Helpers
// ---------------------------------------------------------------------------

const mockWhere = vi.fn();
const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
const mockDb = {
	select: vi.fn().mockReturnValue({ from: mockFrom }),
};

const mockAuth = {
	api: {
		getFullOrganization: vi.fn(),
		listActiveSubscriptions: vi.fn(),
		listOrganizationTeams: vi.fn(),
	},
};

function createOrgContext(overrides: Record<string, unknown> = {}) {
	return createTestContext({
		db: mockDb,
		auth: mockAuth,
		...overrides,
	});
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	// Reset chained mock defaults
	mockDb.select.mockReturnValue({ from: mockFrom });
	mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
	mockInnerJoin.mockReturnValue({ where: mockWhere });
});

// =============================================================================
// getOrganizations
// =============================================================================

describe("getOrganizations", () => {
	it("returns list of org memberships for user", async () => {
		const memberships = [
			{ id: "org-1", name: "Org One", slug: "org-one", logo: null, role: "owner" },
			{ id: "org-2", name: "Org Two", slug: "org-two", logo: "https://example.com/logo.png", role: "member" },
		];
		mockWhere.mockResolvedValueOnce(memberships);

		const ctx = createOrgContext();
		const result = await call(orgRouter.getOrganizations, undefined, { context: ctx });

		expect(mockDb.select).toHaveBeenCalled();
		expect(result).toEqual(memberships);
	});

	it("returns empty array when user has no memberships", async () => {
		mockWhere.mockResolvedValueOnce([]);

		const ctx = createOrgContext();
		const result = await call(orgRouter.getOrganizations, undefined, { context: ctx });

		expect(result).toEqual([]);
	});
});

// =============================================================================
// getActiveOrganization
// =============================================================================

describe("getActiveOrganization", () => {
	it("returns org with subscription, projectLimit, and projectCount", async () => {
		const fullOrg = {
			id: TEST_ORG_ID,
			name: "Test Org",
			slug: "test-org",
			logo: null,
			members: [],
		};
		mockAuth.api.getFullOrganization.mockResolvedValueOnce(fullOrg);
		mockAuth.api.listActiveSubscriptions.mockResolvedValueOnce([
			{ id: "sub_1", status: "active", plan: "pro" },
		]);
		mockAuth.api.listOrganizationTeams.mockResolvedValueOnce([
			{ id: "team-1" },
			{ id: "team-2" },
		]);
		vi.mocked(resolveOrganizationPlan).mockResolvedValueOnce("pro" as any);
		vi.mocked(getEffectiveProjectLimit).mockReturnValueOnce(10);

		const ctx = createOrgContext();
		const result = await call(orgRouter.getActiveOrganization, undefined, { context: ctx });

		expect(mockAuth.api.getFullOrganization).toHaveBeenCalledWith({
			headers: ctx.headers,
			query: { organizationId: TEST_ORG_ID },
		});
		expect(result).toEqual({
			...fullOrg,
			activeSubscription: { id: "sub_1", status: "active", plan: "pro" },
			projectLimit: 10,
			projectCount: 2,
		});
	});

	it("throws FORBIDDEN when session has no activeOrganizationId", async () => {
		const ctx = createOrgContext({
			session: {
				user: { id: TEST_USER_ID },
				session: { activeOrganizationId: null },
			},
		});

		await expect(
			call(orgRouter.getActiveOrganization, undefined, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "FORBIDDEN");

		expect(mockAuth.api.getFullOrganization).not.toHaveBeenCalled();
	});

	it("returns null when getFullOrganization returns null", async () => {
		mockAuth.api.getFullOrganization.mockResolvedValueOnce(null);

		const ctx = createOrgContext();
		const result = await call(orgRouter.getActiveOrganization, undefined, { context: ctx });

		expect(result).toBeNull();
		expect(mockAuth.api.listActiveSubscriptions).not.toHaveBeenCalled();
	});

	it("defaults to FREE plan when no active subscription exists", async () => {
		const fullOrg = {
			id: TEST_ORG_ID,
			name: "Test Org",
			slug: "test-org",
			logo: null,
		};
		mockAuth.api.getFullOrganization.mockResolvedValueOnce(fullOrg);
		mockAuth.api.listActiveSubscriptions.mockResolvedValueOnce([
			{ id: "sub_1", status: "canceled", plan: "pro" },
		]);
		mockAuth.api.listOrganizationTeams.mockResolvedValueOnce([]);
		vi.mocked(resolveOrganizationPlan).mockResolvedValueOnce("free" as any);
		vi.mocked(getEffectiveProjectLimit).mockReturnValueOnce(3);

		const ctx = createOrgContext();
		const result = await call(orgRouter.getActiveOrganization, undefined, { context: ctx });

		expect(result).toEqual({
			...fullOrg,
			activeSubscription: null,
			projectLimit: 3,
			projectCount: 0,
		});
	});
});

// =============================================================================
// getOrganizationTeams
// =============================================================================

describe("getOrganizationTeams", () => {
	it("returns list of teams for the organization", async () => {
		const teams = [
			{ id: "team-1", name: "Engineering" },
			{ id: "team-2", name: "Marketing" },
		];
		mockAuth.api.listOrganizationTeams.mockResolvedValueOnce(teams);

		const ctx = createOrgContext();
		const result = await call(orgRouter.getOrganizationTeams, undefined, { context: ctx });

		expect(mockAuth.api.listOrganizationTeams).toHaveBeenCalledWith({
			headers: ctx.headers,
			query: { organizationId: TEST_ORG_ID },
		});
		expect(result).toEqual(teams);
	});
});

