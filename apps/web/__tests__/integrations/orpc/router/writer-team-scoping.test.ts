import { beforeEach, describe, expect, it } from "vitest";
import { createDb } from "@packages/database/client";
import {
	team,
	teamMember,
	organization,
	member,
	user,
	session,
} from "@packages/database/schemas/auth";
import { writer } from "@packages/database/schemas/writer";
import { eq } from "drizzle-orm";
import {
	getWriterById,
	getWritersByTeamId,
	createWriter,
	deleteWriter,
	updateWriter,
} from "@packages/database/repositories/writer-repository";

describe("Writer Team Scoping", () => {
	let db: ReturnType<typeof createDb>;
	let testUserId: string;
	let testOrgId: string;
	let teamAId: string;
	let teamBId: string;
	let memberId: string;

	beforeEach(async () => {
		db = createDb({ databaseUrl: process.env.DATABASE_URL! });

		// Create test user
		const [testUser] = await db
			.insert(user)
			.values({
				email: `test-writer-scoping-${crypto.randomUUID()}@example.com`,
				name: "Test User",
			})
			.returning();
		testUserId = testUser.id;

		// Create organization
		const [testOrg] = await db
			.insert(organization)
			.values({
				name: "Test Org",
				slug: `test-org-writer-scoping-${crypto.randomUUID()}`,
				createdAt: new Date(),
				onboardingCompleted: true,
			})
			.returning();
		testOrgId = testOrg.id;

		// Create member
		const [createdMember] = await db
			.insert(member)
			.values({
				userId: testUserId,
				organizationId: testOrgId,
				role: "owner",
				createdAt: new Date(),
			})
			.returning();
		memberId = createdMember.id;

		// Create Team A
		const [createdTeamA] = await db
			.insert(team)
			.values({
				name: "Team A",
				organizationId: testOrgId,
				createdAt: new Date(),
			})
			.returning();
		teamAId = createdTeamA.id;

		await db.insert(teamMember).values({
			userId: testUserId,
			teamId: teamAId,
		});

		// Create Team B
		const [createdTeamB] = await db
			.insert(team)
			.values({
				name: "Team B",
				organizationId: testOrgId,
				createdAt: new Date(),
			})
			.returning();
		teamBId = createdTeamB.id;

		await db.insert(teamMember).values({
			userId: testUserId,
			teamId: teamBId,
		});
	});

	it("should create writer scoped to team", async () => {
		const created = await createWriter(db, {
			organizationId: testOrgId,
			teamId: teamAId,
			personaConfig: {
				metadata: {
					name: "Team A Writer",
					description: "Test writer",
				},
			},
		});

		expect(created.teamId).toBe(teamAId);
		expect(created.organizationId).toBe(testOrgId);
	});

	it("should only see writers from specific team", async () => {
		// Create writer in Team A
		await db.insert(writer).values({
			teamId: teamAId,
			organizationId: testOrgId,
			personaConfig: {
				metadata: {
					name: "Team A Writer",
				},
			},
		});

		// Create writer in Team B
		await db.insert(writer).values({
			teamId: teamBId,
			organizationId: testOrgId,
			personaConfig: {
				metadata: {
					name: "Team B Writer",
				},
			},
		});

		const teamAWriters = await getWritersByTeamId(db, teamAId);
		const teamBWriters = await getWritersByTeamId(db, teamBId);

		// Should only see writers from respective teams
		expect(teamAWriters).toHaveLength(1);
		expect(teamAWriters[0].personaConfig.metadata.name).toBe("Team A Writer");
		expect(teamAWriters[0].teamId).toBe(teamAId);

		expect(teamBWriters).toHaveLength(1);
		expect(teamBWriters[0].personaConfig.metadata.name).toBe("Team B Writer");
		expect(teamBWriters[0].teamId).toBe(teamBId);
	});

	it("should isolate writers between teams", async () => {
		// Create writers in both teams
		const [writerA] = await db
			.insert(writer)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				personaConfig: {
					metadata: {
						name: "Writer A",
					},
				},
			})
			.returning();

		const [writerB] = await db
			.insert(writer)
			.values({
				teamId: teamBId,
				organizationId: testOrgId,
				personaConfig: {
					metadata: {
						name: "Writer B",
					},
				},
			})
			.returning();

		// Verify writers exist in their respective teams
		const teamAWriters = await getWritersByTeamId(db, teamAId);
		const teamBWriters = await getWritersByTeamId(db, teamBId);

		expect(teamAWriters).toHaveLength(1);
		expect(teamAWriters[0].id).toBe(writerA.id);

		expect(teamBWriters).toHaveLength(1);
		expect(teamBWriters[0].id).toBe(writerB.id);
	});

	it("should retrieve writer by id with correct team", async () => {
		const [created] = await db
			.insert(writer)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				personaConfig: {
					metadata: {
						name: "Team A Writer",
					},
				},
			})
			.returning();

		const retrieved = await getWriterById(db, created.id);

		expect(retrieved).toBeDefined();
		expect(retrieved?.teamId).toBe(teamAId);
		expect(retrieved?.id).toBe(created.id);
	});

	it("should update writer within same team", async () => {
		const [created] = await db
			.insert(writer)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				personaConfig: {
					metadata: {
						name: "Original Writer",
					},
				},
			})
			.returning();

		const updated = await updateWriter(db, created.id, {
			personaConfig: {
				metadata: {
					name: "Updated Writer",
				},
			},
		});

		expect(updated.personaConfig.metadata.name).toBe("Updated Writer");
		expect(updated.teamId).toBe(teamAId);
	});

	it("should delete writer from team", async () => {
		const [created] = await db
			.insert(writer)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				personaConfig: {
					metadata: {
						name: "To Delete",
					},
				},
			})
			.returning();

		await deleteWriter(db, created.id);

		const retrieved = await getWriterById(db, created.id);
		expect(retrieved).toBeUndefined();
	});

	it("should cascade delete writers when team is deleted", async () => {
		// Create writer in Team A
		const [created] = await db
			.insert(writer)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				personaConfig: {
					metadata: {
						name: "Team A Writer",
					},
				},
			})
			.returning();

		// Delete team (should cascade to writer)
		await db.delete(team).where(eq(team.id, teamAId));

		// Writer should be deleted
		const retrieved = await getWriterById(db, created.id);
		expect(retrieved).toBeUndefined();
	});
});
