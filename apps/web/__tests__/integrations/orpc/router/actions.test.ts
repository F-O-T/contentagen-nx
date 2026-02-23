import { ORPCError, call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import {
	ACTION_ID,
	makeAction,
} from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/action-repository");

import {
	createAction,
	deleteAction,
	getAction,
	listActions,
	updateAction,
} from "@packages/database/repositories/action-repository";

import * as actionsRouter from "@/integrations/orpc/router/actions";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
});

// =============================================================================
// create
// =============================================================================

describe("create", () => {
	const input = {
		name: "Page View + Scroll",
		eventPatterns: ["content.page.viewed", "content.page.scrolled"],
		description: "Compound action for engaged views",
		matchType: "all" as const,
	};

	it("creates action successfully", async () => {
		const action = makeAction();
		vi.mocked(createAction).mockResolvedValueOnce(action);

		const ctx = createTestContext();
		const result = await call(actionsRouter.create, input, { context: ctx });

		expect(createAction).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				name: input.name,
				eventPatterns: input.eventPatterns,
				description: input.description,
				matchType: input.matchType,
				createdBy: TEST_USER_ID,
			}),
		);
		expect(result).toEqual(action);
	});
});

// =============================================================================
// list
// =============================================================================

describe("list", () => {
	it("returns actions list", async () => {
		const actions = [
			makeAction(),
			makeAction({ id: "action-2", name: "Form Submit + Click" }),
		];
		vi.mocked(listActions).mockResolvedValueOnce(actions);

		const ctx = createTestContext();
		const result = await call(actionsRouter.list, undefined, { context: ctx });

		expect(listActions).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
		);
		expect(result).toHaveLength(2);
	});

	it("returns empty array when no actions", async () => {
		vi.mocked(listActions).mockResolvedValueOnce([]);

		const ctx = createTestContext();
		const result = await call(actionsRouter.list, undefined, { context: ctx });

		expect(result).toEqual([]);
	});
});

// =============================================================================
// getById
// =============================================================================

describe("getById", () => {
	it("returns action", async () => {
		const action = makeAction();
		vi.mocked(getAction).mockResolvedValueOnce(action);

		const ctx = createTestContext();
		const result = await call(
			actionsRouter.getById,
			{ id: ACTION_ID },
			{ context: ctx },
		);

		expect(getAction).toHaveBeenCalledWith(
			expect.anything(),
			ACTION_ID,
		);
		expect(result).toEqual(action);
	});

	it("throws NOT_FOUND when action does not exist", async () => {
		vi.mocked(getAction).mockResolvedValueOnce(null as any);

		const ctx = createTestContext();
		await expect(
			call(actionsRouter.getById, { id: ACTION_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});

	it("throws NOT_FOUND when action belongs to different org", async () => {
		const action = makeAction({ organizationId: "other-org-id" });
		vi.mocked(getAction).mockResolvedValueOnce(action);

		const ctx = createTestContext();
		await expect(
			call(actionsRouter.getById, { id: ACTION_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// update
// =============================================================================

describe("update", () => {
	const input = {
		id: ACTION_ID,
		name: "Updated Action Name" as const,
		isActive: false as const,
	};

	it("updates action successfully", async () => {
		vi.mocked(getAction).mockResolvedValueOnce(makeAction());
		const updated = makeAction({
			name: "Updated Action Name",
			isActive: false,
		});
		vi.mocked(updateAction).mockResolvedValueOnce(updated);

		const ctx = createTestContext();
		const result = await call(actionsRouter.update, input, { context: ctx });

		expect(updateAction).toHaveBeenCalledWith(
			expect.anything(),
			ACTION_ID,
			expect.objectContaining({
				name: "Updated Action Name",
				isActive: false,
			}),
		);
		expect(result).toEqual(updated);
	});

	it("throws NOT_FOUND for different org", async () => {
		vi.mocked(getAction).mockResolvedValueOnce(
			makeAction({ organizationId: "other-org" }),
		);

		const ctx = createTestContext();
		await expect(
			call(actionsRouter.update, input, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// remove
// =============================================================================

describe("remove", () => {
	it("deletes action successfully", async () => {
		vi.mocked(getAction).mockResolvedValueOnce(makeAction());
		vi.mocked(deleteAction).mockResolvedValueOnce(undefined);

		const ctx = createTestContext();
		const result = await call(
			actionsRouter.remove,
			{ id: ACTION_ID },
			{ context: ctx },
		);

		expect(deleteAction).toHaveBeenCalledWith(
			expect.anything(),
			ACTION_ID,
		);
		expect(result).toEqual({ success: true });
	});

	it("throws NOT_FOUND for different org", async () => {
		vi.mocked(getAction).mockResolvedValueOnce(
			makeAction({ organizationId: "other-org" }),
		);

		const ctx = createTestContext();
		await expect(
			call(actionsRouter.remove, { id: ACTION_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});
});
