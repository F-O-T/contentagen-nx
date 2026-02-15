import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseInstance } from "../../src/client";
import * as authRepository from "../../src/repositories/auth-repository";
import { dashboards } from "../../src/schemas/dashboards";
import { insights } from "../../src/schemas/insights";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../../src/schemas/auth", () => ({
	organization: {
		id: "id",
		slug: "slug",
		name: "name",
		description: "description",
		context: "context",
		createdAt: "createdAt",
		onboardingCompleted: "onboardingCompleted",
		onboardingTasks: "onboardingTasks",
		onboardingProducts: "onboardingProducts",
	},
	member: {
		organizationId: "organizationId",
		userId: "userId",
		role: "role",
		createdAt: "createdAt",
	},
	team: {
		id: "id",
		name: "name",
		organizationId: "organizationId",
		createdAt: "createdAt",
	},
	teamMember: {
		teamId: "teamId",
		userId: "userId",
		createdAt: "createdAt",
	},
}));

vi.mock("../../src/schemas/dashboards", () => ({
	dashboards: {
		organizationId: "organizationId",
		teamId: "teamId",
		createdBy: "createdBy",
		name: "name",
		description: "description",
		isDefault: "isDefault",
		tiles: "tiles",
		createdAt: "createdAt",
	},
}));

vi.mock("../../src/schemas/insights", () => ({
	insights: {
		id: "id",
		organizationId: "organizationId",
		teamId: "teamId",
		createdBy: "createdBy",
		name: "name",
		description: "description",
		type: "type",
		config: "config",
		defaultSize: "defaultSize",
		createdAt: "createdAt",
	},
}));

vi.mock("../../src/default-insights", () => ({
	DEFAULT_INSIGHTS: [
		{
			name: "Page Views",
			description: "Daily page views",
			type: "trends",
			config: { series: [{ event: "page.view" }] },
			defaultSize: "large",
		},
		{
			name: "Unique Visitors",
			description: "Daily unique visitors",
			type: "trends",
			config: { series: [{ event: "page.view", math: "dau" }] },
			defaultSize: "large",
		},
		{
			name: "Content Created",
			description: "Content created this month",
			type: "trends",
			config: { series: [{ event: "content.created" }] },
			defaultSize: "small",
		},
	],
}));

vi.mock("@packages/utils/text", () => ({
	createSlug: vi.fn((name: string) => name.toLowerCase().replace(/\s+/g, "-")),
	generateRandomSuffix: vi.fn(() => "1234"),
}));

// ---------------------------------------------------------------------------
// Mock Helpers
// ---------------------------------------------------------------------------

function createMockDb() {
	const mockReturning = vi.fn();
	const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
	const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
	const mockWhere = vi.fn().mockResolvedValue(undefined);
	const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
	const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

	return {
		db: {
			insert: mockInsert,
			update: mockUpdate,
			query: {
				organization: {
					findFirst: vi.fn(),
				},
				member: {
					findFirst: vi.fn(),
					findMany: vi.fn(),
				},
				team: {
					findFirst: vi.fn(),
				},
			},
		} as unknown as DatabaseInstance,
		mockInsert,
		mockValues,
		mockReturning,
		mockUpdate,
		mockSet,
		mockWhere,
	};
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
// createDefaultOrganization
// =============================================================================

describe("createDefaultOrganization", () => {
	it("creates organization with default team, insights, and dashboard", async () => {
		const userId = "user-123";
		const userName = "John Doe";

		const mockOrg = {
			id: "org-123",
			name: "John Doe1234",
			slug: "john-doe1234",
			context: "personal",
			description: "John Doe1234",
			createdAt: expect.any(Date),
		};

		const mockTeam = {
			id: "team-123",
			name: "Default",
			organizationId: "org-123",
			createdAt: expect.any(Date),
		};

		const mockInsights = [
			{ id: "insight-1" },
			{ id: "insight-2" },
			{ id: "insight-3" },
		];

		// Mock organization insert
		mocks.mockReturning.mockResolvedValueOnce([mockOrg]);
		// Mock member insert
		mocks.mockReturning.mockResolvedValueOnce([{}]);
		// Mock team insert
		mocks.mockReturning.mockResolvedValueOnce([mockTeam]);
		// Mock team member insert
		mocks.mockReturning.mockResolvedValueOnce([{}]);
		// Mock insights insert
		mocks.mockReturning.mockResolvedValueOnce(mockInsights);
		// Mock dashboard insert
		mocks.mockReturning.mockResolvedValueOnce([{}]);

		const result = await authRepository.createDefaultOrganization(
			mocks.db,
			userId,
			userName,
		);

		// Verify organization was created
		expect(result).toEqual(mockOrg);

		// Verify insert calls
		expect(mocks.mockInsert).toHaveBeenCalledTimes(5); // org, member, team, teamMember, insights, dashboard (6 total)

		// Verify values were called with correct data structures
		expect(mocks.mockValues).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "John Doe1234",
				slug: "john-doe1234",
				context: "personal",
				onboardingCompleted: false,
				onboardingTasks: {},
				onboardingProducts: null,
			}),
		);

		// Verify team was created
		expect(mocks.mockValues).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Default",
				organizationId: "org-123",
			}),
		);
	});

	it("creates default insights with teamId", async () => {
		const userId = "user-123";
		const userName = "Jane Smith";

		const mockOrg = { id: "org-456" };
		const mockTeam = { id: "team-456" };
		const mockInsights = [{ id: "insight-1" }];

		// Mock all inserts
		mocks.mockReturning.mockResolvedValueOnce([mockOrg]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);
		mocks.mockReturning.mockResolvedValueOnce([mockTeam]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);
		mocks.mockReturning.mockResolvedValueOnce(mockInsights);
		mocks.mockReturning.mockResolvedValueOnce([{}]);

		await authRepository.createDefaultOrganization(
			mocks.db,
			userId,
			userName,
		);

		// Find the insights insert call
		const insightsCall = mocks.mockValues.mock.calls.find((call) =>
			Array.isArray(call[0]),
		);

		expect(insightsCall).toBeDefined();
		expect(insightsCall?.[0]).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					organizationId: "org-456",
					teamId: "team-456",
					createdBy: userId,
					name: "Page Views",
				}),
				expect.objectContaining({
					organizationId: "org-456",
					teamId: "team-456",
					createdBy: userId,
					name: "Unique Visitors",
				}),
				expect.objectContaining({
					organizationId: "org-456",
					teamId: "team-456",
					createdBy: userId,
					name: "Content Created",
				}),
			]),
		);
	});

	it("creates default dashboard with teamId and tiles", async () => {
		const userId = "user-123";
		const userName = "Test User";

		const mockOrg = { id: "org-789" };
		const mockTeam = { id: "team-789" };
		const mockInsights = [
			{ id: "insight-1" },
			{ id: "insight-2" },
			{ id: "insight-3" },
		];

		// Mock all inserts
		mocks.mockReturning.mockResolvedValueOnce([mockOrg]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);
		mocks.mockReturning.mockResolvedValueOnce([mockTeam]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);
		mocks.mockReturning.mockResolvedValueOnce(mockInsights);
		mocks.mockReturning.mockResolvedValueOnce([{}]);

		await authRepository.createDefaultOrganization(
			mocks.db,
			userId,
			userName,
		);

		// Find the dashboard insert call
		const dashboardCall = mocks.mockValues.mock.calls[mocks.mockValues.mock.calls.length - 1];

		expect(dashboardCall).toBeDefined();
		expect(dashboardCall?.[0]).toEqual(
			expect.objectContaining({
				organizationId: "org-789",
				teamId: "team-789",
				createdBy: userId,
				name: "Home",
				description: "Default dashboard",
				isDefault: true,
				tiles: [
					{ insightId: "insight-1", size: "large", order: 0 },
					{ insightId: "insight-2", size: "large", order: 1 },
					{ insightId: "insight-3", size: "small", order: 2 },
				],
			}),
		);
	});

	it("adds user to team as team member", async () => {
		const userId = "user-999";
		const userName = "Member User";

		const mockOrg = { id: "org-999" };
		const mockTeam = { id: "team-999" };

		// Mock all inserts
		mocks.mockReturning.mockResolvedValueOnce([mockOrg]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);
		mocks.mockReturning.mockResolvedValueOnce([mockTeam]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);
		mocks.mockReturning.mockResolvedValueOnce([{ id: "insight-1" }]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);

		await authRepository.createDefaultOrganization(
			mocks.db,
			userId,
			userName,
		);

		// Find the team member insert call
		const teamMemberCall = mocks.mockValues.mock.calls.find(
			(call) => call[0]?.teamId === "team-999",
		);

		expect(teamMemberCall).toBeDefined();
		expect(teamMemberCall?.[0]).toEqual(
			expect.objectContaining({
				teamId: "team-999",
				userId: userId,
			}),
		);
	});

	it("handles empty username gracefully", async () => {
		const userId = "user-empty";
		const userName = "";

		const mockOrg = {
			id: "org-empty",
			name: "Workspace1234",
			slug: "workspace1234",
		};

		mocks.mockReturning.mockResolvedValueOnce([mockOrg]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);
		mocks.mockReturning.mockResolvedValueOnce([{ id: "team-1" }]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);
		mocks.mockReturning.mockResolvedValueOnce([{ id: "insight-1" }]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);

		const result = await authRepository.createDefaultOrganization(
			mocks.db,
			userId,
			userName,
		);

		expect(result.name).toBe("Workspace1234");
	});
});

// =============================================================================
// ensureDefaultProject
// =============================================================================

describe("ensureDefaultProject", () => {
	it("returns existing team if one exists", async () => {
		const organizationId = "org-existing";
		const userId = "user-123";

		const existingTeam = {
			id: "team-existing",
			name: "Default",
			organizationId,
		};

		mocks.db.query.team.findFirst = vi.fn().mockResolvedValueOnce(existingTeam);

		const result = await authRepository.ensureDefaultProject(
			mocks.db,
			organizationId,
			userId,
		);

		expect(result).toEqual(existingTeam);
		expect(mocks.mockInsert).not.toHaveBeenCalled();
	});

	it("creates default team if none exists", async () => {
		const organizationId = "org-new";
		const userId = "user-456";

		const newTeam = {
			id: "team-new",
			name: "Default",
			organizationId,
		};

		mocks.db.query.team.findFirst = vi.fn().mockResolvedValueOnce(null);
		mocks.mockReturning.mockResolvedValueOnce([newTeam]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);

		const result = await authRepository.ensureDefaultProject(
			mocks.db,
			organizationId,
			userId,
		);

		expect(result).toEqual(newTeam);
		expect(mocks.mockInsert).toHaveBeenCalledTimes(2); // team + teamMember
	});

	it("adds user as team member when creating new team", async () => {
		const organizationId = "org-new-member";
		const userId = "user-789";

		const newTeam = { id: "team-new-member" };

		mocks.db.query.team.findFirst = vi.fn().mockResolvedValueOnce(null);
		mocks.mockReturning.mockResolvedValueOnce([newTeam]);
		mocks.mockReturning.mockResolvedValueOnce([{}]);

		await authRepository.ensureDefaultProject(
			mocks.db,
			organizationId,
			userId,
		);

		// Verify team member was added
		expect(mocks.mockValues).toHaveBeenCalledWith(
			expect.objectContaining({
				teamId: "team-new-member",
				userId: userId,
			}),
		);
	});
});
