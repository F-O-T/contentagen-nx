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
import { insights } from "@packages/database/schemas/insights";
import { call } from "@orpc/server";
import * as insightsRouter from "@/integrations/orpc/router/insights";
import type { ORPCContextWithAuth } from "@/integrations/orpc/server";

describe("Insights Team Scoping", () => {
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
				email: "test-insights-scoping@example.com",
				name: "Test User",
			})
			.returning();
		testUserId = testUser.id;

		// Create organization
		const [testOrg] = await db
			.insert(organization)
			.values({
				name: "Test Org",
				slug: "test-org-insights-scoping",
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

	it("should create insight scoped to active team", async () => {
		const context = createMockContext(teamAId);

		const created = await call(insightsRouter.create, {
			input: {
				name: "Team A Insight",
				description: "Test insight",
				type: "trends",
				config: { series: [] },
			},
			context,
		});

		expect(created.teamId).toBe(teamAId);
		expect(created.organizationId).toBe(testOrgId);
		expect(created.name).toBe("Team A Insight");
	});

	it("should only see insights from active team", async () => {
		// Create insight in Team A
		await db.insert(insights).values({
			teamId: teamAId,
			organizationId: testOrgId,
			createdBy: testUserId,
			name: "Team A Insight",
			type: "trends",
			config: { series: [] },
		});

		// Create insight in Team B
		await db.insert(insights).values({
			teamId: teamBId,
			organizationId: testOrgId,
			createdBy: testUserId,
			name: "Team B Insight",
			type: "trends",
			config: { series: [] },
		});

		const context = createMockContext(teamAId);
		const results = await call(insightsRouter.list, {
			context,
		});

		// Should only see Team A insight (active team)
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Team A Insight");
		expect(results[0].teamId).toBe(teamAId);
	});

	it("should isolate insights when switching teams", async () => {
		// Create insights in both teams
		await db.insert(insights).values([
			{
				teamId: teamAId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Insight A",
				type: "trends",
				config: { series: [] },
			},
			{
				teamId: teamBId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Insight B",
				type: "trends",
				config: { series: [] },
			},
		]);

		// Query with Team A active
		let context = createMockContext(teamAId);
		let results = await call(insightsRouter.list, { context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Insight A");

		// Query with Team B active
		context = createMockContext(teamBId);
		results = await call(insightsRouter.list, { context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Insight B");
	});

	it("should not allow access to insight from different team", async () => {
		// Create insight in Team A
		const [insight] = await db
			.insert(insights)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Team A Insight",
				type: "trends",
				config: { series: [] },
			})
			.returning();

		// Try to access with Team B context
		const context = createMockContext(teamBId);

		await expect(
			call(insightsRouter.getById, {
				input: { id: insight.id },
				context,
			}),
		).rejects.toThrow("Insight not found");
	});

	it("should not allow updating insight from different team", async () => {
		// Create insight in Team A
		const [insight] = await db
			.insert(insights)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Team A Insight",
				type: "trends",
				config: { series: [] },
			})
			.returning();

		// Try to update with Team B context
		const context = createMockContext(teamBId);

		await expect(
			call(insightsRouter.update, {
				input: { id: insight.id, name: "Updated" },
				context,
			}),
		).rejects.toThrow("Insight not found");
	});

	it("should not allow deleting insight from different team", async () => {
		// Create insight in Team A
		const [insight] = await db
			.insert(insights)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Team A Insight",
				type: "trends",
				config: { series: [] },
			})
			.returning();

		// Try to delete with Team B context
		const context = createMockContext(teamBId);

		await expect(
			call(insightsRouter.remove, {
				input: { id: insight.id },
				context,
			}),
		).rejects.toThrow("Insight not found");
	});

	it("should filter insights by type within active team", async () => {
		// Create different types of insights in Team A
		await db.insert(insights).values([
			{
				teamId: teamAId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Trends Insight",
				type: "trends",
				config: { series: [] },
			},
			{
				teamId: teamAId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Funnel Insight",
				type: "funnels",
				config: { series: [] },
			},
		]);

		const context = createMockContext(teamAId);

		// Query only trends
		const trendsResults = await call(insightsRouter.list, {
			input: { type: "trends" },
			context,
		});
		expect(trendsResults).toHaveLength(1);
		expect(trendsResults[0].type).toBe("trends");

		// Query only funnels
		const funnelsResults = await call(insightsRouter.list, {
			input: { type: "funnels" },
			context,
		});
		expect(funnelsResults).toHaveLength(1);
		expect(funnelsResults[0].type).toBe("funnels");
	});
});
