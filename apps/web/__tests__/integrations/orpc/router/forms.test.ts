import { call, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_TEAM_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import { FORM_ID, makeForm } from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
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
	updateForm,
} from "@packages/database/repositories/form-repository";
import {
	emitFormCreated,
	emitFormDeleted,
	emitFormUpdated,
} from "@packages/events/forms";

import * as formsRouter from "@/integrations/orpc/router/forms";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(emitFormCreated).mockResolvedValue(undefined);
	vi.mocked(emitFormUpdated).mockResolvedValue(undefined);
	vi.mocked(emitFormDeleted).mockResolvedValue(undefined);
});

// =============================================================================
// create
// =============================================================================

describe("create", () => {
	const input = {
		name: "Contact Form",
		fields: [{ id: "f1", type: "text" as const, label: "Name", required: true }],
	};

	it("creates form successfully", async () => {
		const form = makeForm();
		vi.mocked(createForm).mockResolvedValueOnce(form);

		const ctx = createTestContext();
		const result = await call(formsRouter.create, input, { context: ctx });

		expect(createForm).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				name: input.name,
				fields: input.fields,
				settings: {},
			}),
		);
		expect(result).toEqual(form);
	});

	it("emits formCreated event with teamId", async () => {
		const form = makeForm();
		vi.mocked(createForm).mockResolvedValueOnce(form);

		const ctx = createTestContext();
		await call(formsRouter.create, input, { context: ctx });

		expect(emitFormCreated).toHaveBeenCalledWith(
			expect.anything(), // EmitFn
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				formId: FORM_ID,
				name: input.name,
			}),
		);
	});

	it("succeeds even when event emission fails", async () => {
		const form = makeForm();
		vi.mocked(createForm).mockResolvedValueOnce(form);
		vi.mocked(emitFormCreated).mockRejectedValueOnce(new Error("emit failed"));

		const ctx = createTestContext();
		const result = await call(formsRouter.create, input, { context: ctx });

		expect(result).toEqual(form);
	});
});

// =============================================================================
// list
// =============================================================================

describe("list", () => {
	it("returns forms for organization", async () => {
		const forms = [makeForm(), makeForm({ id: "form-2", name: "Signup Form" })];
		// biome-ignore lint/suspicious/noExplicitAny: mock doesn't include submissionCount projection
		vi.mocked(listFormsByTeam).mockResolvedValueOnce(forms as any);

		const ctx = createTestContext();
		const result = await call(formsRouter.list, undefined, { context: ctx });

		expect(listFormsByTeam).toHaveBeenCalledWith(expect.anything(), TEST_TEAM_ID);
		expect(result).toHaveLength(2);
	});
});

// =============================================================================
// getById
// =============================================================================

describe("getById", () => {
	it("returns form when found and belongs to org", async () => {
		const form = makeForm();
		vi.mocked(getFormById).mockResolvedValueOnce(form);

		const ctx = createTestContext();
		const result = await call(
			formsRouter.getById,
			{ id: FORM_ID },
			{ context: ctx },
		);

		expect(getFormById).toHaveBeenCalledWith(expect.anything(), FORM_ID);
		expect(result).toEqual(form);
	});

	it("throws NOT_FOUND when form does not exist", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: mock returns null to simulate not found
		vi.mocked(getFormById).mockResolvedValueOnce(null as any);

		const ctx = createTestContext();
		await expect(
			call(formsRouter.getById, { id: FORM_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<any, any>) => e.code === "NOT_FOUND");
	});

	it("throws NOT_FOUND when form belongs to different org", async () => {
		const form = makeForm({ organizationId: "other-org-id" });
		vi.mocked(getFormById).mockResolvedValueOnce(form);

		const ctx = createTestContext();
		await expect(
			call(formsRouter.getById, { id: FORM_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<any, any>) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// update
// =============================================================================

describe("update", () => {
	const input = {
		id: FORM_ID,
		name: "Updated Form",
		isActive: false as const,
	};

	it("updates form successfully", async () => {
		vi.mocked(getFormById).mockResolvedValueOnce(makeForm());
		const updated = makeForm({ name: "Updated Form", isActive: false });
		vi.mocked(updateForm).mockResolvedValueOnce(updated);

		const ctx = createTestContext();
		const result = await call(formsRouter.update, input, { context: ctx });

		expect(updateForm).toHaveBeenCalledWith(
			expect.anything(),
			FORM_ID,
			expect.objectContaining({
				name: "Updated Form",
				isActive: false,
			}),
		);
		expect(result).toEqual(updated);
	});

	it("throws NOT_FOUND for different org form", async () => {
		vi.mocked(getFormById).mockResolvedValueOnce(
			makeForm({ organizationId: "other-org" }),
		);

		const ctx = createTestContext();
		await expect(
			call(formsRouter.update, input, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<any, any>) => e.code === "NOT_FOUND");
	});

	it("emits formUpdated event with changedFields", async () => {
		vi.mocked(getFormById).mockResolvedValueOnce(makeForm());
		vi.mocked(updateForm).mockResolvedValueOnce(makeForm());

		const ctx = createTestContext();
		await call(formsRouter.update, input, { context: ctx });

		expect(emitFormUpdated).toHaveBeenCalledWith(
			expect.anything(), // EmitFn
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				formId: FORM_ID,
				changedFields: expect.arrayContaining(["name", "isActive"]),
			}),
		);
	});
});

// =============================================================================
// remove
// =============================================================================

describe("remove", () => {
	it("deletes form successfully", async () => {
		vi.mocked(getFormById).mockResolvedValueOnce(makeForm());
		vi.mocked(deleteForm).mockResolvedValueOnce(undefined);

		const ctx = createTestContext();
		const result = await call(
			formsRouter.remove,
			{ id: FORM_ID },
			{ context: ctx },
		);

		expect(deleteForm).toHaveBeenCalledWith(expect.anything(), FORM_ID);
		expect(result).toEqual({ success: true });
	});

	it("emits formDeleted event with teamId", async () => {
		vi.mocked(getFormById).mockResolvedValueOnce(makeForm());
		vi.mocked(deleteForm).mockResolvedValueOnce(undefined);

		const ctx = createTestContext();
		await call(formsRouter.remove, { id: FORM_ID }, { context: ctx });

		expect(emitFormDeleted).toHaveBeenCalledWith(
			expect.anything(), // EmitFn
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				formId: FORM_ID,
			}),
		);
	});
});

// =============================================================================
// getSubmissions
// =============================================================================

describe("getSubmissions", () => {
	it("returns paginated submissions for a valid form", async () => {
		vi.mocked(getFormById).mockResolvedValueOnce(makeForm());
		const mockSubmissions = [
			{ id: "sub-1", formId: FORM_ID, data: { Name: "Alice" } },
			{ id: "sub-2", formId: FORM_ID, data: { Name: "Bob" } },
		];
		// biome-ignore lint/suspicious/noExplicitAny: partial mock object for submission shape
		vi.mocked(getFormSubmissions).mockResolvedValueOnce(mockSubmissions as any);
		vi.mocked(countFormSubmissions).mockResolvedValueOnce(2);

		const ctx = createTestContext();
		const result = await call(
			formsRouter.getSubmissions,
			{ formId: FORM_ID, page: 1, limit: 50 },
			{ context: ctx },
		);

		expect(getFormById).toHaveBeenCalledWith(expect.anything(), FORM_ID);
		expect(getFormSubmissions).toHaveBeenCalledWith(
			expect.anything(),
			FORM_ID,
			{ offset: 0, limit: 50 },
		);
		expect(result).toEqual({
			submissions: mockSubmissions,
			total: 2,
			page: 1,
			limit: 50,
			pages: 1,
		});
	});

	it("throws NOT_FOUND when form belongs to different org", async () => {
		vi.mocked(getFormById).mockResolvedValueOnce(
			makeForm({ organizationId: "other-org" }),
		);

		const ctx = createTestContext();
		await expect(
			call(
				formsRouter.getSubmissions,
				{ formId: FORM_ID, page: 1, limit: 50 },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: ORPCError<any, any>) => e.code === "NOT_FOUND");
	});
});
