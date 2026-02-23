import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseInstance } from "../../src/client";
import * as authRepository from "../../src/repositories/auth-repository";

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
	it("creates organization with default team and team member", async () => {
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

		// Only org and team inserts call .returning()
		mocks.mockReturning.mockResolvedValueOnce([mockOrg]);
		mocks.mockReturning.mockResolvedValueOnce([mockTeam]);

		const result = await authRepository.createDefaultOrganization(
			mocks.db,
			userId,
			userName,
		);

		// Verify organization was created
		expect(result).toEqual(mockOrg);

		// Verify insert calls: org, member, team, teamMember (4 total)
		expect(mocks.mockInsert).toHaveBeenCalledTimes(4);

		// Verify org values
		expect(mocks.mockValues).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "John Doe1234",
				slug: "john-doe1234",
				context: "personal",
				onboardingCompleted: false,
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

	it("adds user to team as team member", async () => {
		const userId = "user-999";
		const userName = "Member User";

		const mockOrg = { id: "org-999" };
		const mockTeam = { id: "team-999" };

		// Only org and team inserts call .returning()
		mocks.mockReturning.mockResolvedValueOnce([mockOrg]);
		mocks.mockReturning.mockResolvedValueOnce([mockTeam]);

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

		// Only org and team inserts call .returning()
		mocks.mockReturning.mockResolvedValueOnce([mockOrg]);
		mocks.mockReturning.mockResolvedValueOnce([{ id: "team-1" }]);

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
