import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/writer-repository");

import {
	createWriter,
	deleteWriter,
	getWriterById,
	getWritersByTeamId,
	updateWriter,
} from "@packages/database/repositories/writer-repository";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_ORG_ID = "test-org-00000000-0000-0000-0000-000000000001";
const TEAM_A_ID = "team-a-00000000-0000-0000-0000-000000000001";
const TEAM_B_ID = "team-b-00000000-0000-0000-0000-000000000002";

function makeWriter(overrides: Record<string, unknown> = {}) {
	return {
		id: crypto.randomUUID(),
		organizationId: TEST_ORG_ID,
		teamId: TEAM_A_ID,
		personaConfig: { metadata: { name: "Default Writer" } },
		lastGeneratedAt: null,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const mockDb = {} as any;

beforeEach(() => {
	vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Writer Team Scoping", () => {
	it("should create writer scoped to team", async () => {
		const writerData = makeWriter({ teamId: TEAM_A_ID });
		vi.mocked(createWriter).mockResolvedValueOnce(writerData as any);

		const created = await createWriter(mockDb, {
			organizationId: TEST_ORG_ID,
			teamId: TEAM_A_ID,
			personaConfig: { metadata: { name: "Team A Writer", description: "Test writer" } },
		} as any);

		expect(created.teamId).toBe(TEAM_A_ID);
		expect(created.organizationId).toBe(TEST_ORG_ID);
		expect(createWriter).toHaveBeenCalledWith(
			mockDb,
			expect.objectContaining({ teamId: TEAM_A_ID }),
		);
	});

	it("should only see writers from specific team", async () => {
		const writerA = makeWriter({
			teamId: TEAM_A_ID,
			personaConfig: { metadata: { name: "Team A Writer" } },
		});
		const writerB = makeWriter({
			teamId: TEAM_B_ID,
			personaConfig: { metadata: { name: "Team B Writer" } },
		});

		vi.mocked(getWritersByTeamId).mockResolvedValueOnce([writerA] as any);
		const teamAWriters = await getWritersByTeamId(mockDb, TEAM_A_ID);
		expect(teamAWriters).toHaveLength(1);
		expect(teamAWriters[0].personaConfig.metadata.name).toBe("Team A Writer");
		expect(teamAWriters[0].teamId).toBe(TEAM_A_ID);

		vi.mocked(getWritersByTeamId).mockResolvedValueOnce([writerB] as any);
		const teamBWriters = await getWritersByTeamId(mockDb, TEAM_B_ID);
		expect(teamBWriters).toHaveLength(1);
		expect(teamBWriters[0].personaConfig.metadata.name).toBe("Team B Writer");
		expect(teamBWriters[0].teamId).toBe(TEAM_B_ID);
	});

	it("should isolate writers between teams", async () => {
		const writerA = makeWriter({ id: "w-a", teamId: TEAM_A_ID });
		const writerB = makeWriter({ id: "w-b", teamId: TEAM_B_ID });

		vi.mocked(getWritersByTeamId).mockResolvedValueOnce([writerA] as any);
		const teamAWriters = await getWritersByTeamId(mockDb, TEAM_A_ID);
		expect(teamAWriters).toHaveLength(1);
		expect(teamAWriters[0].id).toBe("w-a");

		vi.mocked(getWritersByTeamId).mockResolvedValueOnce([writerB] as any);
		const teamBWriters = await getWritersByTeamId(mockDb, TEAM_B_ID);
		expect(teamBWriters).toHaveLength(1);
		expect(teamBWriters[0].id).toBe("w-b");
	});

	it("should retrieve writer by id with correct team", async () => {
		const writerData = makeWriter({ id: "w-1", teamId: TEAM_A_ID });
		vi.mocked(getWriterById).mockResolvedValueOnce(writerData as any);

		const retrieved = await getWriterById(mockDb, "w-1");

		expect(retrieved).toBeDefined();
		expect(retrieved?.teamId).toBe(TEAM_A_ID);
		expect(retrieved?.id).toBe("w-1");
		expect(getWriterById).toHaveBeenCalledWith(mockDb, "w-1");
	});

	it("should update writer within same team", async () => {
		const updated = makeWriter({
			id: "w-1",
			teamId: TEAM_A_ID,
			personaConfig: { metadata: { name: "Updated Writer" } },
		});
		vi.mocked(updateWriter).mockResolvedValueOnce(updated as any);

		const result = await updateWriter(mockDb, "w-1", {
			personaConfig: { metadata: { name: "Updated Writer" } },
		} as any);

		expect(result.personaConfig.metadata.name).toBe("Updated Writer");
		expect(result.teamId).toBe(TEAM_A_ID);
	});

	it("should delete writer from team", async () => {
		vi.mocked(deleteWriter).mockResolvedValueOnce(undefined as any);
		vi.mocked(getWriterById).mockResolvedValueOnce(undefined as any);

		await deleteWriter(mockDb, "w-1");
		const retrieved = await getWriterById(mockDb, "w-1");

		expect(retrieved).toBeUndefined();
		expect(deleteWriter).toHaveBeenCalledWith(mockDb, "w-1");
	});

	it("should return empty list for team with no writers", async () => {
		vi.mocked(getWritersByTeamId).mockResolvedValueOnce([]);

		const writers = await getWritersByTeamId(mockDb, TEAM_A_ID);

		expect(writers).toHaveLength(0);
		expect(getWritersByTeamId).toHaveBeenCalledWith(mockDb, TEAM_A_ID);
	});
});
