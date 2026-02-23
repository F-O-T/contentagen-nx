import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import { makeDashboard } from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/dashboard-repository");
vi.mock("@packages/events/dashboard");

import {
	createDashboard,
	getDashboardById,
	listDashboardsByTeam,
} from "@packages/database/repositories/dashboard-repository";
import {
	emitDashboardCreated,
	emitDashboardDeleted,
	emitDashboardUpdated,
} from "@packages/events/dashboard";

import * as dashboardsRouter from "@/integrations/orpc/router/dashboards";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEAM_A_ID = "team-a-00000000-0000-0000-0000-000000000001";
const TEAM_B_ID = "team-b-00000000-0000-0000-0000-000000000002";

function createTeamContext(teamId: string) {
	return createTestContext({
		teamId,
		session: {
			user: { id: TEST_USER_ID },
			session: { activeOrganizationId: TEST_ORG_ID, activeTeamId: teamId },
		},
	});
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(emitDashboardCreated).mockResolvedValue(undefined);
	vi.mocked(emitDashboardUpdated).mockResolvedValue(undefined);
	vi.mocked(emitDashboardDeleted).mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Dashboards Team Scoping", () => {
	it("should create dashboard scoped to active team", async () => {
		const dashboard = makeDashboard({
			teamId: TEAM_A_ID,
			name: "Team A Dashboard",
		});
		vi.mocked(createDashboard).mockResolvedValueOnce(dashboard);

		const context = createTeamContext(TEAM_A_ID);
		const created = await call(
			dashboardsRouter.create,
			{ name: "Team A Dashboard", description: "Test dashboard" },
			{ context },
		);

		expect(created.teamId).toBe(TEAM_A_ID);
		expect(created.organizationId).toBe(TEST_ORG_ID);
		expect(created.name).toBe("Team A Dashboard");
	});

	it("should only see dashboards from active team", async () => {
		const teamADashboard = makeDashboard({
			id: "d1",
			teamId: TEAM_A_ID,
			name: "Team A Dashboard",
		});

		vi.mocked(listDashboardsByTeam).mockResolvedValueOnce([teamADashboard]);

		const context = createTeamContext(TEAM_A_ID);
		const results = await call(dashboardsRouter.list, undefined, { context });

		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Team A Dashboard");
		expect(results[0].teamId).toBe(TEAM_A_ID);
		expect(listDashboardsByTeam).toHaveBeenCalledWith(
			expect.anything(),
			TEAM_A_ID,
		);
	});

	it("should isolate dashboards when switching teams", async () => {
		const dashA = makeDashboard({ id: "d1", teamId: TEAM_A_ID, name: "Dashboard A" });
		const dashB = makeDashboard({ id: "d2", teamId: TEAM_B_ID, name: "Dashboard B" });

		// Team A active
		vi.mocked(listDashboardsByTeam).mockResolvedValueOnce([dashA]);
		let context = createTeamContext(TEAM_A_ID);
		let results = await call(dashboardsRouter.list, undefined, { context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Dashboard A");

		// Team B active
		vi.mocked(listDashboardsByTeam).mockResolvedValueOnce([dashB]);
		context = createTeamContext(TEAM_B_ID);
		results = await call(dashboardsRouter.list, undefined, { context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Dashboard B");
	});

	it("should not allow access to dashboard from different team", async () => {
		// Dashboard belongs to Team A
		const dashboard = makeDashboard({ teamId: TEAM_A_ID });
		vi.mocked(getDashboardById).mockResolvedValueOnce(dashboard);

		// Access with Team B context
		const context = createTeamContext(TEAM_B_ID);

		await expect(
			call(dashboardsRouter.getById, { id: dashboard.id }, { context }),
		).rejects.toThrow("Dashboard not found");
	});

	it("should not allow updating dashboard from different team", async () => {
		const dashboard = makeDashboard({ teamId: TEAM_A_ID });
		vi.mocked(getDashboardById).mockResolvedValueOnce(dashboard);

		const context = createTeamContext(TEAM_B_ID);

		await expect(
			call(
				dashboardsRouter.update,
				{ id: dashboard.id, name: "Updated" },
				{ context },
			),
		).rejects.toThrow("Dashboard not found");
	});

	it("should not allow deleting dashboard from different team", async () => {
		const dashboard = makeDashboard({ teamId: TEAM_A_ID });
		vi.mocked(getDashboardById).mockResolvedValueOnce(dashboard);

		const context = createTeamContext(TEAM_B_ID);

		await expect(
			call(dashboardsRouter.remove, { id: dashboard.id }, { context }),
		).rejects.toThrow("Dashboard not found");
	});
});
