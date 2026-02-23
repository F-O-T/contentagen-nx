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
import { dashboards } from "@packages/database/schemas/dashboards";
import { call } from "@orpc/server";
import * as dashboardsRouter from "@/integrations/orpc/router/dashboards";
import type { ORPCContextWithAuth } from "@/integrations/orpc/server";

describe("Dashboards Team Scoping", () => {
	let db: ReturnType<typeof createDb>;
	let testUserId: string;
	let testOrgId: string;
	let teamAId: string;
	let teamBId: string;
	let sessionToken: string;

	beforeEach(async () => {
		db = createDb({ databaseUrl: process.env.DATABASE_URL! });

		// Create test user
		const [testUser] = await db
			.insert(user)
			.values({
				email: `test-dashboards-scoping-${crypto.randomUUID()}@example.com`,
				name: "Test User",
			})
			.returning();
		testUserId = testUser.id;

		// Create organization
		const [testOrg] = await db
			.insert(organization)
			.values({
				name: "Test Org",
				slug: `test-org-dashboards-scoping-${crypto.randomUUID()}`,
				createdAt: new Date(),
				onboardingCompleted: true,
			})
			.returning();
		testOrgId = testOrg.id;

		// Create member
		await db
			.insert(member)
			.values({
				userId: testUserId,
				organizationId: testOrgId,
				role: "owner",
				createdAt: new Date(),
			});

		// Create Team A
		const [createdTeamA] = await db
			.insert(team)
			.values({
				name: "Team A",
				slug: `team-a-${crypto.randomUUID()}`,
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
				slug: `team-b-${crypto.randomUUID()}`,
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

	it("should create dashboard scoped to active team", async () => {
		const context = createMockContext(teamAId);

		const created = await call(dashboardsRouter.create, {
				name: "Team A Dashboard",
				description: "Test dashboard",
			}, { context });

		expect(created.teamId).toBe(teamAId);
		expect(created.organizationId).toBe(testOrgId);
		expect(created.name).toBe("Team A Dashboard");
	});

	it("should only see dashboards from active team", async () => {
		// Create dashboard in Team A
		await db.insert(dashboards).values({
			teamId: teamAId,
			organizationId: testOrgId,
			createdBy: testUserId,
			name: "Team A Dashboard",
		});

		// Create dashboard in Team B
		await db.insert(dashboards).values({
			teamId: teamBId,
			organizationId: testOrgId,
			createdBy: testUserId,
			name: "Team B Dashboard",
		});

		const context = createMockContext(teamAId);
		const results = await call(dashboardsRouter.list, undefined, { context });

		// Should only see Team A dashboard (active team)
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Team A Dashboard");
		expect(results[0].teamId).toBe(teamAId);
	});

	it("should isolate dashboards when switching teams", async () => {
		// Create dashboards in both teams
		await db.insert(dashboards).values([
			{
				teamId: teamAId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Dashboard A",
			},
			{
				teamId: teamBId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Dashboard B",
			},
		]);

		// Query with Team A active
		let context = createMockContext(teamAId);
		let results = await call(dashboardsRouter.list, undefined, { context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Dashboard A");

		// Query with Team B active
		context = createMockContext(teamBId);
		results = await call(dashboardsRouter.list, undefined, { context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Dashboard B");
	});

	it("should not allow access to dashboard from different team", async () => {
		// Create dashboard in Team A
		const [dashboard] = await db
			.insert(dashboards)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Team A Dashboard",
			})
			.returning();

		// Try to access with Team B context
		const context = createMockContext(teamBId);

		await expect(
			call(dashboardsRouter.getById, { id: dashboard.id }, { context }),
		).rejects.toThrow("Dashboard not found");
	});

	it("should not allow updating dashboard from different team", async () => {
		// Create dashboard in Team A
		const [dashboard] = await db
			.insert(dashboards)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Team A Dashboard",
			})
			.returning();

		// Try to update with Team B context
		const context = createMockContext(teamBId);

		await expect(
			call(dashboardsRouter.update, { id: dashboard.id, name: "Updated" }, { context }),
		).rejects.toThrow("Dashboard not found");
	});

	it("should not allow deleting dashboard from different team", async () => {
		// Create dashboard in Team A
		const [dashboard] = await db
			.insert(dashboards)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				createdBy: testUserId,
				name: "Team A Dashboard",
			})
			.returning();

		// Try to delete with Team B context
		const context = createMockContext(teamBId);

		await expect(
			call(dashboardsRouter.remove, { id: dashboard.id }, { context }),
		).rejects.toThrow("Dashboard not found");
	});
});
