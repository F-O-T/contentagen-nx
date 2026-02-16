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
import { forms, formSubmissions } from "@packages/database/schemas/forms";
import { eq } from "drizzle-orm";
import { call } from "@orpc/server";
import * as formsRouter from "@/integrations/orpc/router/forms";
import type { ORPCContextWithAuth } from "@/integrations/orpc/server";

describe("Forms Team Scoping", () => {
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
				email: "test-forms-team-scoping@example.com",
				name: "Test User",
			})
			.returning();
		testUserId = testUser.id;

		// Create organization
		const [testOrg] = await db
			.insert(organization)
			.values({
				name: "Test Org Forms",
				slug: "test-org-forms-team-scoping",
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
				token: `test-token-forms-${Date.now()}`,
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

	it("should create form scoped to active team", async () => {
		const context = createMockContext(teamAId);

		const created = await call(formsRouter.create, {
			input: {
				name: "Team A Form",
				description: "Form for team A",
				fields: [
					{
						id: "name",
						type: "text",
						label: "Name",
						required: true,
					},
				],
			},
			context,
		});

		expect(created.teamId).toBe(teamAId);
		expect(created.organizationId).toBe(testOrgId);
		expect(created.name).toBe("Team A Form");
	});

	it("should only see forms from active team", async () => {
		// Create form in Team A
		await db.insert(forms).values({
			teamId: teamAId,
			organizationId: testOrgId,
			name: "Team A Form",
			fields: [
				{
					id: "email",
					type: "email",
					label: "Email",
					required: true,
				},
			],
		});

		// Create form in Team B
		await db.insert(forms).values({
			teamId: teamBId,
			organizationId: testOrgId,
			name: "Team B Form",
			fields: [
				{
					id: "phone",
					type: "text",
					label: "Phone",
					required: false,
				},
			],
		});

		const context = createMockContext(teamAId);
		const results = await call(formsRouter.list, {
			input: undefined,
			context,
		});

		// Should only see Team A form (active team)
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Team A Form");
		expect(results[0].teamId).toBe(teamAId);
	});

	it("should isolate forms when switching teams", async () => {
		// Create forms in both teams
		await db.insert(forms).values([
			{
				teamId: teamAId,
				organizationId: testOrgId,
				name: "Form A",
				fields: [{ id: "a", type: "text", label: "A", required: true }],
			},
			{
				teamId: teamBId,
				organizationId: testOrgId,
				name: "Form B",
				fields: [{ id: "b", type: "text", label: "B", required: true }],
			},
		]);

		// Query with Team A active
		let context = createMockContext(teamAId);
		let results = await call(formsRouter.list, {
			input: undefined,
			context,
		});
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Form A");

		// Query with Team B active
		context = createMockContext(teamBId);
		results = await call(formsRouter.list, { input: undefined, context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Form B");
	});

	it("should prevent accessing form from different team", async () => {
		// Create form in Team A
		const [formA] = await db
			.insert(forms)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				name: "Team A Form",
				fields: [{ id: "x", type: "text", label: "X", required: true }],
			})
			.returning();

		// Try to access with Team B context
		const context = createMockContext(teamBId);

		await expect(
			call(formsRouter.getById, {
				input: { id: formA.id },
				context,
			}),
		).rejects.toThrow("Form not found");
	});

	it("should isolate form submissions by team", async () => {
		// Create forms in both teams
		const [formA] = await db
			.insert(forms)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				name: "Form A",
				fields: [{ id: "name", type: "text", label: "Name", required: true }],
			})
			.returning();

		const [formB] = await db
			.insert(forms)
			.values({
				teamId: teamBId,
				organizationId: testOrgId,
				name: "Form B",
				fields: [{ id: "email", type: "email", label: "Email", required: true }],
			})
			.returning();

		// Create submissions for both forms
		await db.insert(formSubmissions).values([
			{
				formId: formA.id,
				organizationId: testOrgId,
				teamId: teamAId,
				data: { name: "John" },
			},
			{
				formId: formB.id,
				organizationId: testOrgId,
				teamId: teamBId,
				data: { email: "john@example.com" },
			},
		]);

		// Team A should only see their submissions
		const contextA = createMockContext(teamAId);
		const submissionsA = await call(formsRouter.getSubmissions, {
			input: { formId: formA.id },
			context: contextA,
		});
		expect(submissionsA.submissions).toHaveLength(1);
		expect(submissionsA.submissions[0].teamId).toBe(teamAId);

		// Team B should not be able to access Team A's submissions
		const contextB = createMockContext(teamBId);
		await expect(
			call(formsRouter.getSubmissions, {
				input: { formId: formA.id },
				context: contextB,
			}),
		).rejects.toThrow("Form not found");
	});

	it("should prevent updating form from different team", async () => {
		// Create form in Team A
		const [formA] = await db
			.insert(forms)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				name: "Team A Form",
				fields: [{ id: "x", type: "text", label: "X", required: true }],
			})
			.returning();

		// Try to update with Team B context
		const context = createMockContext(teamBId);

		await expect(
			call(formsRouter.update, {
				input: {
					id: formA.id,
					name: "Hacked Form",
				},
				context,
			}),
		).rejects.toThrow("Form not found");
	});

	it("should prevent deleting form from different team", async () => {
		// Create form in Team A
		const [formA] = await db
			.insert(forms)
			.values({
				teamId: teamAId,
				organizationId: testOrgId,
				name: "Team A Form",
				fields: [{ id: "x", type: "text", label: "X", required: true }],
			})
			.returning();

		// Try to delete with Team B context
		const context = createMockContext(teamBId);

		await expect(
			call(formsRouter.remove, {
				input: { id: formA.id },
				context,
			}),
		).rejects.toThrow("Form not found");

		// Verify form still exists
		const [stillExists] = await db
			.select()
			.from(forms)
			.where(eq(forms.id, formA.id));
		expect(stillExists).toBeDefined();
	});
});
