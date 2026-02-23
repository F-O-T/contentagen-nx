import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import { makeForm } from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/form-repository");
vi.mock("@packages/events/forms");

import {
	countFormSubmissions,
	createForm,
	deleteForm,
	getFormById,
	getFormSubmissions,
	listFormsByTeam,
} from "@packages/database/repositories/form-repository";
import {
	emitFormCreated,
	emitFormDeleted,
	emitFormUpdated,
} from "@packages/events/forms";

import * as formsRouter from "@/integrations/orpc/router/forms";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEAM_A_ID = "team-a-00000000-0000-0000-0000-000000000001";
const TEAM_B_ID = "team-b-00000000-0000-0000-0000-000000000002";
const FORM_A_ID = "f0f0a0a0-b1b1-4c2c-9d3d-000000000001";

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
	vi.mocked(emitFormCreated).mockResolvedValue(undefined);
	vi.mocked(emitFormUpdated).mockResolvedValue(undefined);
	vi.mocked(emitFormDeleted).mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Forms Team Scoping", () => {
	it("should create form scoped to active team", async () => {
		const form = makeForm({ teamId: TEAM_A_ID, name: "Team A Form" });
		vi.mocked(createForm).mockResolvedValueOnce(form);

		const context = createTeamContext(TEAM_A_ID);
		const created = await call(
			formsRouter.create,
			{
				name: "Team A Form",
				description: "Form for team A",
				fields: [{ id: "name", type: "text" as const, label: "Name", required: true }],
			},
			{ context },
		);

		expect(created.teamId).toBe(TEAM_A_ID);
		expect(created.organizationId).toBe(TEST_ORG_ID);
		expect(created.name).toBe("Team A Form");
	});

	it("should only see forms from active team", async () => {
		const teamAForm = makeForm({
			id: "f1",
			teamId: TEAM_A_ID,
			name: "Team A Form",
		});

		vi.mocked(listFormsByTeam).mockResolvedValueOnce([{ ...teamAForm, submissionCount: 0 }]);

		const context = createTeamContext(TEAM_A_ID);
		const results = await call(formsRouter.list, undefined, { context });

		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Team A Form");
		expect(results[0].teamId).toBe(TEAM_A_ID);
		expect(listFormsByTeam).toHaveBeenCalledWith(expect.anything(), TEAM_A_ID);
	});

	it("should isolate forms when switching teams", async () => {
		const formA = makeForm({ id: "f1", teamId: TEAM_A_ID, name: "Form A" });
		const formB = makeForm({ id: "f2", teamId: TEAM_B_ID, name: "Form B" });

		// Team A active
		vi.mocked(listFormsByTeam).mockResolvedValueOnce([{ ...formA, submissionCount: 0 }]);
		let context = createTeamContext(TEAM_A_ID);
		let results = await call(formsRouter.list, undefined, { context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Form A");

		// Team B active
		vi.mocked(listFormsByTeam).mockResolvedValueOnce([{ ...formB, submissionCount: 0 }]);
		context = createTeamContext(TEAM_B_ID);
		results = await call(formsRouter.list, undefined, { context });
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe("Form B");
	});

	it("should prevent accessing form from different team", async () => {
		// Form belongs to Team A
		const form = makeForm({ teamId: TEAM_A_ID });
		vi.mocked(getFormById).mockResolvedValueOnce(form);

		// Access with Team B context
		const context = createTeamContext(TEAM_B_ID);

		await expect(
			call(formsRouter.getById, { id: form.id }, { context }),
		).rejects.toThrow("Form not found");
	});

	it("should isolate form submissions by team", async () => {
		const formA = makeForm({ id: FORM_A_ID, teamId: TEAM_A_ID, name: "Form A" });

		// Team A accessing own form — should work
		vi.mocked(getFormById).mockResolvedValueOnce(formA);
		vi.mocked(getFormSubmissions).mockResolvedValueOnce([
			{
				id: "sub-1",
				formId: FORM_A_ID,
				organizationId: TEST_ORG_ID,
				teamId: TEAM_A_ID,
				data: { name: "John" },
				metadata: null,
				submittedAt: new Date(),
			},
		]);
		vi.mocked(countFormSubmissions).mockResolvedValueOnce(1);

		const contextA = createTeamContext(TEAM_A_ID);
		const submissionsA = await call(
			formsRouter.getSubmissions,
			{ formId: FORM_A_ID },
			{ context: contextA },
		);
		expect(submissionsA.submissions).toHaveLength(1);
		expect(submissionsA.submissions[0].teamId).toBe(TEAM_A_ID);

		// Team B trying to access Team A's form — should fail
		vi.mocked(getFormById).mockResolvedValueOnce(formA);
		const contextB = createTeamContext(TEAM_B_ID);
		await expect(
			call(formsRouter.getSubmissions, { formId: FORM_A_ID }, { context: contextB }),
		).rejects.toThrow("Form not found");
	});

	it("should prevent updating form from different team", async () => {
		const form = makeForm({ teamId: TEAM_A_ID });
		vi.mocked(getFormById).mockResolvedValueOnce(form);

		const context = createTeamContext(TEAM_B_ID);

		await expect(
			call(formsRouter.update, { id: form.id, name: "Hacked Form" }, { context }),
		).rejects.toThrow("Form not found");
	});

	it("should prevent deleting form from different team", async () => {
		const form = makeForm({ teamId: TEAM_A_ID });
		vi.mocked(getFormById).mockResolvedValueOnce(form);

		const context = createTeamContext(TEAM_B_ID);

		await expect(
			call(formsRouter.remove, { id: form.id }, { context }),
		).rejects.toThrow("Form not found");

		// deleteForm should NOT have been called
		expect(deleteForm).not.toHaveBeenCalled();
	});
});
