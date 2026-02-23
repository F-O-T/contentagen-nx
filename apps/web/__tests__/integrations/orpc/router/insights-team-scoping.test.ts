import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import { makeInsight } from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/insight-repository");
vi.mock("@packages/events/insight");

import {
	createInsight,
	deleteInsight,
	getInsightById,
	listInsightsByTeam,
} from "@packages/database/repositories/insight-repository";
import {
	emitInsightCreated,
	emitInsightDeleted,
	emitInsightUpdated,
} from "@packages/events/insight";

import * as insightsRouter from "@/integrations/orpc/router/insights";

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
	vi.mocked(emitInsightCreated).mockResolvedValue(undefined);
	vi.mocked(emitInsightUpdated).mockResolvedValue(undefined);
	vi.mocked(emitInsightDeleted).mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Insights Team Scoping", () => {
	it("should create insight scoped to active team", async () => {
		const insight = makeInsight({
			teamId: TEAM_A_ID,
			name: "Team A Insight",
			type: "trends",
		});
		vi.mocked(createInsight).mockResolvedValueOnce(insight);

		const context = createTeamContext(TEAM_A_ID);
		const created = await call(
			insightsRouter.create,
			{
				name: "Team A Insight",
				description: "Test insight",
				type: "trends",
				config: {
					type: "trends",
					series: [{ event: "test_event" }],
					dateRange: { type: "relative" as const, value: "7d" as const },
				},
			},
			{ context },
		);

		expect(created.teamId).toBe(TEAM_A_ID);
		expect(created.organizationId).toBe(TEST_ORG_ID);
		expect(created.name).toBe("Team A Insight");
	});

	it("should only see insights from active team", async () => {
		const teamAInsight = makeInsight({
			id: "i1",
			teamId: TEAM_A_ID,
			name: "Team A Insight",
		});

		vi.mocked(listInsightsByTeam).mockResolvedValueOnce([teamAInsight]);

		const context = createTeamContext(TEAM_A_ID);
		const results = await call(insightsRouter.list, undefined, { context });

		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Team A Insight");
		expect(results[0].teamId).toBe(TEAM_A_ID);
		expect(listInsightsByTeam).toHaveBeenCalledWith(
			expect.anything(),
			TEAM_A_ID,
			undefined,
		);
	});

	it("should isolate insights when switching teams", async () => {
		const insightA = makeInsight({ id: "i1", teamId: TEAM_A_ID, name: "Insight A" });
		const insightB = makeInsight({ id: "i2", teamId: TEAM_B_ID, name: "Insight B" });

		// Team A active
		vi.mocked(listInsightsByTeam).mockResolvedValueOnce([insightA]);
		let context = createTeamContext(TEAM_A_ID);
		let results = await call(insightsRouter.list, undefined, { context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Insight A");

		// Team B active
		vi.mocked(listInsightsByTeam).mockResolvedValueOnce([insightB]);
		context = createTeamContext(TEAM_B_ID);
		results = await call(insightsRouter.list, undefined, { context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Insight B");
	});

	it("should not allow access to insight from different team", async () => {
		const insight = makeInsight({ teamId: TEAM_A_ID });
		vi.mocked(getInsightById).mockResolvedValueOnce(insight);

		const context = createTeamContext(TEAM_B_ID);

		await expect(
			call(insightsRouter.getById, { id: insight.id }, { context }),
		).rejects.toThrow("Insight not found");
	});

	it("should not allow updating insight from different team", async () => {
		const insight = makeInsight({ teamId: TEAM_A_ID });
		vi.mocked(getInsightById).mockResolvedValueOnce(insight);

		const context = createTeamContext(TEAM_B_ID);

		await expect(
			call(
				insightsRouter.update,
				{ id: insight.id, name: "Updated" },
				{ context },
			),
		).rejects.toThrow("Insight not found");
	});

	it("should not allow deleting insight from different team", async () => {
		const insight = makeInsight({ teamId: TEAM_A_ID });
		vi.mocked(getInsightById).mockResolvedValueOnce(insight);

		const context = createTeamContext(TEAM_B_ID);

		await expect(
			call(insightsRouter.remove, { id: insight.id }, { context }),
		).rejects.toThrow("Insight not found");

		expect(deleteInsight).not.toHaveBeenCalled();
	});

	it("should filter insights by type within active team", async () => {
		const trendsInsight = makeInsight({
			id: "i1",
			teamId: TEAM_A_ID,
			name: "Trends Insight",
			type: "trends",
		});
		const funnelInsight = makeInsight({
			id: "i2",
			teamId: TEAM_A_ID,
			name: "Funnel Insight",
			type: "funnels",
		});

		const context = createTeamContext(TEAM_A_ID);

		// Query only trends
		vi.mocked(listInsightsByTeam).mockResolvedValueOnce([trendsInsight]);
		const trendsResults = await call(
			insightsRouter.list,
			{ type: "trends" },
			{ context },
		);
		expect(trendsResults).toHaveLength(1);
		expect(trendsResults[0].type).toBe("trends");

		// Query only funnels
		vi.mocked(listInsightsByTeam).mockResolvedValueOnce([funnelInsight]);
		const funnelsResults = await call(
			insightsRouter.list,
			{ type: "funnels" },
			{ context },
		);
		expect(funnelsResults).toHaveLength(1);
		expect(funnelsResults[0].type).toBe("funnels");
	});
});
