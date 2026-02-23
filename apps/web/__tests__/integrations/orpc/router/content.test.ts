import { ORPCError, call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_TEAM_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";
import { CONTENT_ID, makeContent } from "../../../helpers/mock-factories";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/content-repository");
vi.mock("@packages/events/content");
vi.mock("@packages/events/credits");

import {
	archiveContent,
	countContentsByTeam,
	createContent,
	deleteContent,
	getContentById,
	listContentsByTeam,
	publishContent,
	updateContent,
} from "@packages/database/repositories/content-repository";
import {
	emitContentArchived,
	emitContentCreated,
	emitContentDeleted,
	emitContentPublished,
	emitContentUpdated,
} from "@packages/events/content";
import { enforceCreditBudget, trackCreditUsage } from "@packages/events/credits";

import * as contentRouter from "@/integrations/orpc/router/content";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	// Default: enforceCreditBudget and trackCreditUsage resolve silently
	vi.mocked(enforceCreditBudget).mockResolvedValue(undefined);
	vi.mocked(trackCreditUsage).mockResolvedValue(undefined);
	// Default: emit functions resolve
	vi.mocked(emitContentCreated).mockResolvedValue(undefined);
	vi.mocked(emitContentUpdated).mockResolvedValue(undefined);
	vi.mocked(emitContentDeleted).mockResolvedValue(undefined);
	vi.mocked(emitContentPublished).mockResolvedValue(undefined);
	vi.mocked(emitContentArchived).mockResolvedValue(undefined);
});

// =============================================================================
// getById
// =============================================================================

describe("getById", () => {
	it("returns content when found and belongs to org", async () => {
		const content = makeContent();
		vi.mocked(getContentById).mockResolvedValueOnce(content);

		const ctx = createTestContext();
		const result = await call(contentRouter.getById, { id: CONTENT_ID }, { context: ctx });

		expect(getContentById).toHaveBeenCalledWith(expect.anything(), CONTENT_ID);
		expect(result).toEqual(content);
	});

	it("throws NOT_FOUND when content does not exist", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(null as any);

		const ctx = createTestContext();
		await expect(
			call(contentRouter.getById, { id: CONTENT_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});

	it("throws NOT_FOUND when content belongs to different org", async () => {
		const content = makeContent({ organizationId: "other-org-id" });
		vi.mocked(getContentById).mockResolvedValueOnce(content);

		const ctx = createTestContext();
		await expect(
			call(contentRouter.getById, { id: CONTENT_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// create
// =============================================================================

describe("create", () => {
	const input = {
		title: "New Post",
		body: "Body text",
	};

	function makeCreateCtx() {
		return createTestContext({
			db: {
				query: {
					member: {
						findMany: vi.fn().mockResolvedValueOnce([{ id: "member-1" }]),
					},
				},
			},
		});
	}

	it("creates content successfully", async () => {
		const created = makeContent({ id: "new-id" });
		vi.mocked(createContent).mockResolvedValueOnce(created);

		const ctx = makeCreateCtx();
		const result = await call(contentRouter.create, input, { context: ctx });

		expect(createContent).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				teamId: TEST_TEAM_ID,
				createdByMemberId: "member-1",
			}),
		);
		expect(result).toEqual(created);
	});

	it("throws FORBIDDEN when no member found", async () => {
		const ctx = createTestContext({
			db: {
				query: {
					member: {
						findMany: vi.fn().mockResolvedValueOnce([]),
					},
				},
			},
		});

		await expect(
			call(contentRouter.create, input, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "FORBIDDEN");
	});

	it("emits contentCreated event with teamId", async () => {
		const created = makeContent({ id: "new-id" });
		vi.mocked(createContent).mockResolvedValueOnce(created);

		const ctx = makeCreateCtx();
		await call(contentRouter.create, input, { context: ctx });

		expect(emitContentCreated).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({ contentId: "new-id", title: "New Post" }),
		);
	});

	it("succeeds even when event emission fails", async () => {
		const created = makeContent({ id: "new-id" });
		vi.mocked(createContent).mockResolvedValueOnce(created);
		vi.mocked(emitContentCreated).mockRejectedValueOnce(new Error("emit failed"));

		const ctx = makeCreateCtx();
		const result = await call(contentRouter.create, input, { context: ctx });

		expect(result).toEqual(created);
	});
});

// =============================================================================
// update
// =============================================================================

describe("update", () => {
	const input = {
		id: CONTENT_ID,
		data: { body: "Updated body" },
	};

	it("updates content successfully", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(makeContent());
		const updated = makeContent({ body: "Updated body" });
		vi.mocked(updateContent).mockResolvedValueOnce(updated);

		const ctx = createTestContext();
		const result = await call(contentRouter.update, input, { context: ctx });

		expect(updateContent).toHaveBeenCalledWith(
			expect.anything(),
			CONTENT_ID,
			expect.objectContaining({ body: "Updated body" }),
		);
		expect(result).toEqual(updated);
	});

	it("throws NOT_FOUND for different org content", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(
			makeContent({ organizationId: "other-org" }),
		);

		const ctx = createTestContext();
		await expect(
			call(contentRouter.update, input, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});

	it("calls enforceCreditBudget with platform pool", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(makeContent());
		vi.mocked(updateContent).mockResolvedValueOnce(makeContent());

		const ctx = createTestContext();
		await call(contentRouter.update, input, { context: ctx });

		expect(enforceCreditBudget).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
			"platform",
		);
	});

	it("throws FORBIDDEN when credit budget is exhausted", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(makeContent());
		vi.mocked(enforceCreditBudget).mockRejectedValueOnce(
			new ORPCError("FORBIDDEN", { message: "Credit exhausted" }),
		);

		const ctx = createTestContext();
		await expect(
			call(contentRouter.update, input, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "FORBIDDEN");
	});

	it("emits contentUpdated event with teamId and changedFields", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(makeContent());
		vi.mocked(updateContent).mockResolvedValueOnce(makeContent());

		const ctx = createTestContext();
		await call(contentRouter.update, input, { context: ctx });

		expect(emitContentUpdated).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				contentId: CONTENT_ID,
				changedFields: ["body"],
			}),
		);
	});

	it("tracks credit usage after update", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(makeContent());
		vi.mocked(updateContent).mockResolvedValueOnce(makeContent());

		const ctx = createTestContext();
		await call(contentRouter.update, input, { context: ctx });

		expect(trackCreditUsage).toHaveBeenCalledWith(
			expect.anything(),
			"content.page.updated",
			TEST_ORG_ID,
			"platform",
		);
	});
});

// =============================================================================
// remove
// =============================================================================

describe("remove", () => {
	it("deletes content successfully", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(makeContent());
		vi.mocked(deleteContent).mockResolvedValueOnce(makeContent());

		const ctx = createTestContext();
		const result = await call(contentRouter.remove, { id: CONTENT_ID }, { context: ctx });

		expect(deleteContent).toHaveBeenCalledWith(expect.anything(), CONTENT_ID);
		expect(result).toBeDefined();
	});

	it("throws NOT_FOUND for different org content", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(
			makeContent({ organizationId: "other-org" }),
		);

		const ctx = createTestContext();
		await expect(
			call(contentRouter.remove, { id: CONTENT_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
	});

	it("emits contentDeleted event with teamId", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(makeContent());
		vi.mocked(deleteContent).mockResolvedValueOnce(makeContent());

		const ctx = createTestContext();
		await call(contentRouter.remove, { id: CONTENT_ID }, { context: ctx });

		expect(emitContentDeleted).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({ contentId: CONTENT_ID }),
		);
	});
});

// =============================================================================
// publish
// =============================================================================

describe("publish", () => {
	it("publishes content and emits event", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(makeContent());
		vi.mocked(publishContent).mockResolvedValueOnce(makeContent());

		const ctx = createTestContext();
		const result = await call(contentRouter.publish, { id: CONTENT_ID }, { context: ctx });

		expect(publishContent).toHaveBeenCalledWith(expect.anything(), CONTENT_ID);
		expect(emitContentPublished).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				contentId: CONTENT_ID,
				title: "Test",
				slug: "test",
				wordCount: 2, // "Hello world"
			}),
		);
		expect(result).toBeDefined();
	});

	it("calls enforceCreditBudget before publishing", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(makeContent());
		vi.mocked(enforceCreditBudget).mockRejectedValueOnce(
			new ORPCError("FORBIDDEN", { message: "Credit exhausted" }),
		);

		const ctx = createTestContext();
		await expect(
			call(contentRouter.publish, { id: CONTENT_ID }, { context: ctx }),
		).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "FORBIDDEN");

		// publishContent should not have been called
		expect(publishContent).not.toHaveBeenCalled();
	});
});

// =============================================================================
// archive
// =============================================================================

describe("archive", () => {
	it("archives content and emits contentArchived event with teamId", async () => {
		vi.mocked(getContentById).mockResolvedValueOnce(makeContent());
		vi.mocked(archiveContent).mockResolvedValueOnce(makeContent());

		const ctx = createTestContext();
		const result = await call(contentRouter.archive, { id: CONTENT_ID }, { context: ctx });

		expect(archiveContent).toHaveBeenCalledWith(expect.anything(), CONTENT_ID);
		expect(emitContentArchived).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({ contentId: CONTENT_ID }),
		);
		expect(result).toBeDefined();
	});
});

// =============================================================================
// listAllContent
// =============================================================================

describe("listAllContent", () => {
	it("returns paginated results", async () => {
		const items = [makeContent(), makeContent({ id: "content-2" })];
		vi.mocked(countContentsByTeam).mockResolvedValueOnce(2);
		vi.mocked(listContentsByTeam).mockResolvedValueOnce(items);

		const ctx = createTestContext();
		const result = await call(
			contentRouter.listAllContent,
			{ limit: 20, page: 1 },
			{ context: ctx },
		);

		expect(result).toEqual({
			items,
			limit: 20,
			page: 1,
			total: 2,
			totalPages: 1,
		});
	});

	it("returns empty results when total is 0", async () => {
		vi.mocked(countContentsByTeam).mockResolvedValueOnce(0);

		const ctx = createTestContext();
		const result = await call(
			contentRouter.listAllContent,
			{ limit: 20, page: 1 },
			{ context: ctx },
		);

		expect(result).toEqual({
			items: [],
			limit: 20,
			page: 1,
			total: 0,
			totalPages: 0,
		});
		expect(listContentsByTeam).not.toHaveBeenCalled();
	});
});
