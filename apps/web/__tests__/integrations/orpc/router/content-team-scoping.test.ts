import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import { makeContent } from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/content-repository");
vi.mock("@packages/events/content");
vi.mock("@packages/events/credits");

import {
	countContentsByTeam,
	createContent,
	listContentsByTeam,
} from "@packages/database/repositories/content-repository";
import { emitContentCreated } from "@packages/events/content";
import {
	enforceCreditBudget,
	trackCreditUsage,
} from "@packages/events/credits";

import * as contentRouter from "@/integrations/orpc/router/content";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEAM_A_ID = "team-a-00000000-0000-0000-0000-000000000001";
const TEAM_B_ID = "team-b-00000000-0000-0000-0000-000000000002";

function createTeamContext(teamId: string, extra: Record<string, unknown> = {}) {
	return createTestContext({
		teamId,
		session: {
			user: { id: TEST_USER_ID },
			session: { activeOrganizationId: TEST_ORG_ID, activeTeamId: teamId },
		},
		...extra,
	});
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(enforceCreditBudget).mockResolvedValue(undefined);
	vi.mocked(trackCreditUsage).mockResolvedValue(undefined);
	vi.mocked(emitContentCreated).mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Content Team Scoping", () => {
	it("should create content scoped to active team", async () => {
		const created = makeContent({ teamId: TEAM_A_ID, organizationId: TEST_ORG_ID });
		vi.mocked(createContent).mockResolvedValueOnce(created);

		const context = createTeamContext(TEAM_A_ID, {
			db: {
				query: {
					member: {
						findMany: vi.fn().mockResolvedValue([{ id: "member-1" }]),
					},
				},
			},
		});

		const result = await call(
			contentRouter.create,
			{ title: "Team A Content", body: "Content for team A" },
			{ context },
		);

		expect(result.teamId).toBe(TEAM_A_ID);
		expect(result.organizationId).toBe(TEST_ORG_ID);
	});

	it("should only see content from active team", async () => {
		const teamAContent = makeContent({
			id: "c1",
			teamId: TEAM_A_ID,
			meta: { title: "Team A", description: "", slug: "a" },
		});

		vi.mocked(countContentsByTeam).mockResolvedValueOnce(1);
		vi.mocked(listContentsByTeam).mockResolvedValueOnce([teamAContent]);

		const context = createTeamContext(TEAM_A_ID);
		const results = await call(contentRouter.listAllContent, {}, { context });

		expect(results.items).toHaveLength(1);
		expect(results.items[0].meta.title).toBe("Team A");
		expect(results.items[0].teamId).toBe(TEAM_A_ID);

		// Verify the repository was called with the correct team ID
		expect(listContentsByTeam).toHaveBeenCalledWith(
			expect.anything(),
			TEAM_A_ID,
			expect.objectContaining({ limit: 20, offset: 0 }),
		);
	});

	it("should isolate content when switching teams", async () => {
		const teamAContent = makeContent({
			id: "c1",
			teamId: TEAM_A_ID,
			meta: { title: "A", description: "", slug: "a" },
		});
		const teamBContent = makeContent({
			id: "c2",
			teamId: TEAM_B_ID,
			meta: { title: "B", description: "", slug: "b" },
		});

		// First call: Team A active
		vi.mocked(countContentsByTeam).mockResolvedValueOnce(1);
		vi.mocked(listContentsByTeam).mockResolvedValueOnce([teamAContent]);

		let context = createTeamContext(TEAM_A_ID);
		let results = await call(contentRouter.listAllContent, {}, { context });
		expect(results.items).toHaveLength(1);
		expect(results.items[0].meta.title).toBe("A");

		// Second call: Team B active
		vi.mocked(countContentsByTeam).mockResolvedValueOnce(1);
		vi.mocked(listContentsByTeam).mockResolvedValueOnce([teamBContent]);

		context = createTeamContext(TEAM_B_ID);
		results = await call(contentRouter.listAllContent, {}, { context });
		expect(results.items).toHaveLength(1);
		expect(results.items[0].meta.title).toBe("B");
	});
});
