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

vi.mock("@packages/database/schemas/auth", () => ({
	organization: {
		id: "id",
		slug: "slug",
		onboardingTasks: "onboardingTasks",
		onboardingCompleted: "onboardingCompleted",
		onboardingProducts: "onboardingProducts",
		name: "name",
	},
	user: { id: "id", name: "name" },
	team: { id: "id", name: "name", organizationId: "organizationId" },
}));
vi.mock("@packages/database/schemas/content", () => ({
	content: { organizationId: "organizationId", status: "status" },
}));
vi.mock("@packages/database/schemas/forms", () => ({
	forms: { organizationId: "organizationId" },
}));
vi.mock("@packages/database/schemas/insights", () => ({
	insights: { organizationId: "organizationId" },
}));
vi.mock("@packages/database/schemas/dashboards", () => ({
	dashboards: { organizationId: "organizationId" },
}));
vi.mock("@packages/utils/text", () => ({
	createSlug: vi.fn((name: string) =>
		name.toLowerCase().replace(/\s+/g, "-"),
	),
}));

import { createSlug } from "@packages/utils/text";
import * as onboardingRouter from "@/integrations/orpc/router/onboarding";

// ---------------------------------------------------------------------------
// Mock Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock db with:
 * - db.query.organization.findFirst (for getOnboardingStatus)
 * - db.select().from().where().then() chain (for 5 count queries + slug check)
 * - db.update().set().where() chain (for mutations)
 * - db.select().from().where().limit() chain (for slug uniqueness check)
 */
function createMockDb() {
	const mockWhere = vi.fn();
	const mockLimit = vi.fn();
	const mockFrom = vi.fn();
	const mockSet = vi.fn();

	// Chain: db.select().from().where() — returns thenable for count queries
	mockWhere.mockReturnValue({
		then: vi.fn((cb: any) => cb([{ count: 0 }])),
		limit: mockLimit,
	});
	mockLimit.mockResolvedValue([]);
	mockFrom.mockReturnValue({ where: mockWhere });

	// Chain: db.update().set().where()
	const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
	mockSet.mockReturnValue({ where: mockUpdateWhere });

	return {
		db: {
			query: {
				organization: {
					findFirst: vi.fn(),
				},
				team: {
					findFirst: vi.fn(),
				},
			},
			select: vi.fn().mockReturnValue({ from: mockFrom }),
			update: vi.fn().mockReturnValue({ set: mockSet }),
		},
		mockFrom,
		mockWhere,
		mockLimit,
		mockSet,
		mockUpdateWhere,
	};
}

function createOnboardingContext(
	mockDb: ReturnType<typeof createMockDb>["db"],
	overrides: Record<string, unknown> = {},
) {
	return createTestContext({
		db: mockDb,
		...overrides,
	});
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mocks: ReturnType<typeof createMockDb>;

beforeEach(() => {
	vi.clearAllMocks();
	mocks = createMockDb();
});

// =============================================================================
// getOnboardingStatus
// =============================================================================

describe("getOnboardingStatus", () => {
	it("returns onboarding status with auto-detected tasks", async () => {
		mocks.db.query.team.findFirst.mockResolvedValueOnce({
			id: "test-team-id",
			name: "Test Team",
			organizationId: TEST_ORG_ID,
		});

		mocks.db.query.organization.findFirst.mockResolvedValueOnce({
			id: TEST_ORG_ID,
			onboardingCompleted: false,
			onboardingProducts: ["content"],
			onboardingTasks: { setup_profile: true },
		});

		// Mock the 5 count queries: content=2, published=1, forms=1, insights=0, dashboards=0
		let callIndex = 0;
		const counts = [2, 1, 1, 0, 0];
		mocks.mockWhere.mockImplementation(() => ({
			then: vi.fn((cb: any) => cb([{ count: counts[callIndex++] }])),
			limit: mocks.mockLimit,
		}));

		const ctx = createOnboardingContext(mocks.db);
		const result = await call(onboardingRouter.getOnboardingStatus, undefined, { context: ctx });

		expect(mocks.db.query.organization.findFirst).toHaveBeenCalled();
		expect(result).toEqual({
			onboardingCompleted: false,
			onboardingProducts: ["content"],
			tasks: {
				setup_profile: true,
				create_content: true,
				publish_content: true,
				create_form: true,
			},
		});
	});

	it("throws NOT_FOUND when organization does not exist", async () => {
		mocks.db.query.team.findFirst.mockResolvedValueOnce(null);
		mocks.db.query.organization.findFirst.mockResolvedValueOnce(null);

		const ctx = createOnboardingContext(mocks.db);

		await expect(
			call(onboardingRouter.getOnboardingStatus, undefined, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError) => e.code === "NOT_FOUND");
	});

	it("returns all false tasks when org is fresh", async () => {
		mocks.db.query.team.findFirst.mockResolvedValueOnce({
			id: "test-team-id",
			name: "Test Team",
			organizationId: TEST_ORG_ID,
		});
		mocks.db.query.organization.findFirst.mockResolvedValueOnce({
			id: TEST_ORG_ID,
			onboardingCompleted: false,
			onboardingProducts: null,
			onboardingTasks: null,
		});

		// All count queries return 0
		mocks.mockWhere.mockImplementation(() => ({
			then: vi.fn((cb: any) => cb([{ count: 0 }])),
			limit: mocks.mockLimit,
		}));

		const ctx = createOnboardingContext(mocks.db);
		const result = await call(onboardingRouter.getOnboardingStatus, undefined, { context: ctx });

		expect(result).toEqual({
			onboardingCompleted: false,
			onboardingProducts: null,
			tasks: null,
		});
	});

	it("merges stored tasks with auto-detected ones", async () => {
		mocks.db.query.team.findFirst.mockResolvedValueOnce({
			id: "test-team-id",
			name: "Test Team",
			organizationId: TEST_ORG_ID,
		});
		mocks.db.query.organization.findFirst.mockResolvedValueOnce({
			id: TEST_ORG_ID,
			onboardingCompleted: false,
			onboardingProducts: ["content", "forms"],
			onboardingTasks: { invite_team: true, custom_task: true },
		});

		// content=1, published=0, forms=0, insights=1, dashboards=1
		let callIndex = 0;
		const counts = [1, 0, 0, 1, 1];
		mocks.mockWhere.mockImplementation(() => ({
			then: vi.fn((cb: any) => cb([{ count: counts[callIndex++] }])),
			limit: mocks.mockLimit,
		}));

		const ctx = createOnboardingContext(mocks.db);
		const result = await call(onboardingRouter.getOnboardingStatus, undefined, { context: ctx });

		expect(result).toEqual({
			onboardingCompleted: false,
			onboardingProducts: ["content", "forms"],
			tasks: {
				invite_team: true,
				custom_task: true,
				create_content: true,
				create_insight: true,
				create_dashboard: true,
			},
		});
	});
});

// =============================================================================
// completeProfileSetup
// =============================================================================

describe("completeProfileSetup", () => {
	it("updates user name, org name/slug, and renames default team", async () => {
		// Slug uniqueness check returns empty (no conflict)
		mocks.mockLimit.mockResolvedValueOnce([]);
		// Default team query
		mocks.mockLimit.mockResolvedValueOnce([{ id: "team-1", name: "Default", organizationId: TEST_ORG_ID }]);

		const ctx = createOnboardingContext(mocks.db);
		const result = await call(
			onboardingRouter.completeProfileSetup,
			{ userName: "Alice", workspaceName: "My Workspace" },
			{ context: ctx },
		);

		expect(createSlug).toHaveBeenCalledWith("My Workspace");
		expect(result).toEqual({ success: true, slug: "my-workspace" });
		// Three parallel updates: user name + org name/slug + team name
		expect(mocks.db.update).toHaveBeenCalledTimes(3);
	});

	it("throws BAD_REQUEST when slug is invalid", async () => {
		vi.mocked(createSlug).mockReturnValueOnce(null);

		const ctx = createOnboardingContext(mocks.db);

		await expect(
			call(
				onboardingRouter.completeProfileSetup,
				{ userName: "Alice", workspaceName: "!!!" },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: ORPCError) => e.code === "BAD_REQUEST");
	});

	it("throws CONFLICT when slug is already taken", async () => {
		// Slug uniqueness check returns an existing org
		mocks.mockLimit.mockResolvedValueOnce([{ id: "other-org-id" }]);

		const ctx = createOnboardingContext(mocks.db);

		await expect(
			call(
				onboardingRouter.completeProfileSetup,
				{ userName: "Alice", workspaceName: "Taken Name" },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: ORPCError) => e.code === "CONFLICT");
	});

	it("throws NOT_FOUND when default team does not exist", async () => {
		// Slug uniqueness check returns empty (no conflict)
		mocks.mockLimit.mockResolvedValueOnce([]);
		// Default team query returns empty
		mocks.mockLimit.mockResolvedValueOnce([]);

		const ctx = createOnboardingContext(mocks.db);

		await expect(
			call(
				onboardingRouter.completeProfileSetup,
				{ userName: "Alice", workspaceName: "My Workspace" },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: ORPCError) => e.code === "NOT_FOUND");
	});

	it("renames default team to workspace name", async () => {
		// Slug uniqueness check returns empty (no conflict)
		mocks.mockLimit.mockResolvedValueOnce([]);
		// Default team query
		const defaultTeam = { id: "team-1", name: "Default", organizationId: TEST_ORG_ID };
		mocks.mockLimit.mockResolvedValueOnce([defaultTeam]);

		const ctx = createOnboardingContext(mocks.db);
		await call(
			onboardingRouter.completeProfileSetup,
			{ userName: "Alice", workspaceName: "My Awesome Project" },
			{ context: ctx },
		);

		// Verify team update was called
		expect(mocks.db.update).toHaveBeenCalledTimes(3);
		expect(mocks.mockSet).toHaveBeenCalledWith({ name: "My Awesome Project" });
	});
});

// =============================================================================
// selectProducts
// =============================================================================

describe("selectProducts", () => {
	it("updates onboardingProducts", async () => {
		const ctx = createOnboardingContext(mocks.db);
		const result = await call(
			onboardingRouter.selectProducts,
			{ products: ["content", "forms"] },
			{ context: ctx },
		);

		expect(result).toEqual({ success: true });
		expect(mocks.db.update).toHaveBeenCalled();
		expect(mocks.mockSet).toHaveBeenCalledWith({
			onboardingProducts: ["content", "forms"],
		});
	});
});

// =============================================================================
// completeOnboarding
// =============================================================================

describe("completeOnboarding", () => {
	it("marks onboarding as complete", async () => {
		const ctx = createOnboardingContext(mocks.db);
		const result = await call(onboardingRouter.completeOnboarding, undefined, { context: ctx });

		expect(result).toEqual({ success: true });
		expect(mocks.db.update).toHaveBeenCalled();
		expect(mocks.mockSet).toHaveBeenCalledWith({ onboardingCompleted: true });
	});
});

// =============================================================================
// completeTask
// =============================================================================

describe("completeTask", () => {
	it("atomically merges task into onboardingTasks", async () => {
		const ctx = createOnboardingContext(mocks.db);
		const result = await call(
			onboardingRouter.completeTask,
			{ taskId: "setup_profile" },
			{ context: ctx },
		);

		expect(result).toEqual({ success: true });
		expect(mocks.db.update).toHaveBeenCalled();
		expect(mocks.mockSet).toHaveBeenCalled();
	});
});

// =============================================================================
// skipTask
// =============================================================================

describe("skipTask", () => {
	it("marks task as done (same as completeTask)", async () => {
		const ctx = createOnboardingContext(mocks.db);
		const result = await call(
			onboardingRouter.skipTask,
			{ taskId: "invite_team" },
			{ context: ctx },
		);

		expect(result).toEqual({ success: true });
		expect(mocks.db.update).toHaveBeenCalled();
		expect(mocks.mockSet).toHaveBeenCalled();
	});
});

// =============================================================================
// Onboarding Fields Persistence
// =============================================================================

describe("Onboarding Fields Persistence", () => {
	it("should persist onboardingProducts when selected", async () => {
		// Mock getOnboardingStatus to verify persistence
		mocks.db.query.team.findFirst.mockResolvedValueOnce({
			id: "test-team-id",
			name: "Test Team",
			organizationId: TEST_ORG_ID,
		});
		mocks.db.query.organization.findFirst.mockResolvedValueOnce({
			id: TEST_ORG_ID,
			onboardingCompleted: false,
			onboardingProducts: ["content", "forms"],
			onboardingTasks: {},
		});

		// All count queries return 0
		mocks.mockWhere.mockImplementation(() => ({
			then: vi.fn((cb: any) => cb([{ count: 0 }])),
			limit: mocks.mockLimit,
		}));

		const ctx = createOnboardingContext(mocks.db);

		// First, select products
		await call(
			onboardingRouter.selectProducts,
			{ products: ["content", "forms"] },
			{ context: ctx },
		);

		// Then fetch status to verify persistence
		const status = await call(onboardingRouter.getOnboardingStatus, undefined, { context: ctx });
		expect(status.onboardingProducts).toEqual(["content", "forms"]);
	});

	it("should persist onboardingTasks when completed", async () => {
		// Mock getOnboardingStatus to verify persistence
		mocks.db.query.team.findFirst.mockResolvedValueOnce({
			id: "test-team-id",
			name: "Test Team",
			organizationId: TEST_ORG_ID,
		});
		mocks.db.query.organization.findFirst.mockResolvedValueOnce({
			id: TEST_ORG_ID,
			onboardingCompleted: false,
			onboardingProducts: null,
			onboardingTasks: { create_content: true },
		});

		// All count queries return 0
		mocks.mockWhere.mockImplementation(() => ({
			then: vi.fn((cb: any) => cb([{ count: 0 }])),
			limit: mocks.mockLimit,
		}));

		const ctx = createOnboardingContext(mocks.db);

		// First, complete a task
		await call(
			onboardingRouter.completeTask,
			{ taskId: "create_content" },
			{ context: ctx },
		);

		// Then fetch status to verify persistence
		const status = await call(onboardingRouter.getOnboardingStatus, undefined, { context: ctx });
		expect(status.tasks?.create_content).toBe(true);
	});

	it("should initialize with empty tasks and null products", async () => {
		// Mock a fresh org
		mocks.db.query.team.findFirst.mockResolvedValueOnce({
			id: "test-team-id",
			name: "Test Team",
			organizationId: TEST_ORG_ID,
		});
		mocks.db.query.organization.findFirst.mockResolvedValueOnce({
			id: TEST_ORG_ID,
			onboardingCompleted: false,
			onboardingProducts: null,
			onboardingTasks: {},
		});

		// All count queries return 0
		mocks.mockWhere.mockImplementation(() => ({
			then: vi.fn((cb: any) => cb([{ count: 0 }])),
			limit: mocks.mockLimit,
		}));

		const ctx = createOnboardingContext(mocks.db);
		const status = await call(onboardingRouter.getOnboardingStatus, undefined, { context: ctx });

		expect(status.onboardingProducts).toBeNull();
		expect(status.tasks).toEqual({});
	});
});
