import { beforeEach, describe, expect, it } from "vitest";
import { createDb } from "@packages/database/client";
import {
	content,
	team,
	teamMember,
	organization,
	member,
	user,
	session,
} from "@packages/database/schemas/auth";
import { eq } from "drizzle-orm";
import { call } from "@orpc/server";
import * as contentRouter from "@/integrations/orpc/router/content";
import type { ORPCContextWithAuth } from "@/integrations/orpc/server";

describe("Content Team Scoping", () => {
	let db: ReturnType<typeof createDb>;
	let testUserId: string;
	let testOrgId: string;
	let teamAId: string;
	let teamBId: string;
	let sessionToken: string;
	let memberId: string;

	beforeEach(async () => {
		db = createDb({ databaseUrl: process.env.DATABASE_URL! });

		// Create test user
		const [testUser] = await db
			.insert(user)
			.values({
				email: `test-team-scoping-${crypto.randomUUID()}@example.com`,
				name: "Test User",
			})
			.returning();
		testUserId = testUser.id;

		// Create organization
		const [testOrg] = await db
			.insert(organization)
			.values({
				name: "Test Org",
				slug: `test-org-team-scoping-${crypto.randomUUID()}`,
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

		// Create session with Team A active
		const [createdSession] = await db
			.insert(session)
			.values({
				userId: testUserId,
				activeOrganizationId: testOrgId,
				activeTeamId: teamAId,
				expiresAt: new Date(Date.now() + 86400000),
				token: `test-token-${Date.now()}`,
			})
			.returning();
		sessionToken = createdSession.token;
	});

	// Helper to create mock context
	function createMockContext(activeTeamId: string): ORPCContextWithAuth {
		return {
			auth: { api: {} },
			db,
			headers: new Headers({ Authorization: `Bearer ${sessionToken}` }),
			request: new Request("http://localhost"),
			session: {
				user: { id: testUserId },
				session: {
					activeOrganizationId: testOrgId,
					activeTeamId,
				},
			},
			organizationId: testOrgId,
			teamId: activeTeamId,
			userId: testUserId,
			posthog: {
				capture: () => {},
				identify: () => {},
				groupIdentify: () => {},
				shutdown: async () => {},
			},
		} as unknown as ORPCContextWithAuth;
	}

	it("should create content scoped to active team", async () => {
		const context = createMockContext(teamAId);

		const created = await call(contentRouter.create, {
			input: {
				meta: {
					title: "Team A Content",
					description: "Test",
					slug: "team-a-content",
				},
				body: "Content for team A",
			},
			context,
		});

		expect(created.teamId).toBe(teamAId);
		expect(created.organizationId).toBe(testOrgId);
	});

	it("should only see content from active team", async () => {
		// Create content in Team A
		await db.insert(content).values({
			teamId: teamAId,
			organizationId: testOrgId,
			createdByMemberId: memberId,
			meta: { title: "Team A", description: "", slug: "a" },
		});

		// Create content in Team B
		await db.insert(content).values({
			teamId: teamBId,
			organizationId: testOrgId,
			createdByMemberId: memberId,
			meta: { title: "Team B", description: "", slug: "b" },
		});

		const context = createMockContext(teamAId);
		const results = await call(contentRouter.listAllContent, {
			input: {},
			context,
		});

		// Should only see Team A content (active team)
		expect(results.items).toHaveLength(1);
		expect(results.items[0].meta.title).toBe("Team A");
		expect(results.items[0].teamId).toBe(teamAId);
	});

	it("should isolate content when switching teams", async () => {
		// Create content in both teams
		await db.insert(content).values([
			{
				teamId: teamAId,
				organizationId: testOrgId,
				createdByMemberId: memberId,
				meta: { title: "A", description: "", slug: "a" },
			},
			{
				teamId: teamBId,
				organizationId: testOrgId,
				createdByMemberId: memberId,
				meta: { title: "B", description: "", slug: "b" },
			},
		]);

		// Query with Team A active
		let context = createMockContext(teamAId);
		let results = await call(contentRouter.listAllContent, {
			input: {},
			context,
		});
		expect(results.items).toHaveLength(1);
		expect(results.items[0].meta.title).toBe("A");

		// Query with Team B active
		context = createMockContext(teamBId);
		results = await call(contentRouter.listAllContent, { input: {}, context });
		expect(results.items).toHaveLength(1);
		expect(results.items[0].meta.title).toBe("B");
	});
});
