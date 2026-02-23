import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ORPCError } from "@orpc/server";

vi.mock("@packages/database/repositories/annotation-repository");

import {
	createAnnotation,
	deleteAnnotation,
	getAnnotation,
	listAnnotations,
	updateAnnotation,
} from "@packages/database/repositories/annotation-repository";
import * as annotationsRouter from "@/integrations/orpc/router/annotations";
import {
	ANNOTATION_ID,
	makeAnnotation,
} from "../../../helpers/mock-factories";
import {
	TEST_ORG_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";

describe("annotations router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		it("creates annotation with title, date, scope, and createdBy", async () => {
			const mockAnnotation = makeAnnotation();
			vi.mocked(createAnnotation).mockResolvedValue(mockAnnotation);

			const ctx = createTestContext();
			const result = await call(
				annotationsRouter.create,
				{
					title: "Test Annotation",
					date: "2026-02-09T00:00:00.000Z",
					scope: "global",
				},
				{ context: ctx },
			);

			expect(createAnnotation).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					title: "Test Annotation",
					scope: "global",
					organizationId: TEST_ORG_ID,
					createdBy: TEST_USER_ID,
				}),
			);
			expect(result).toEqual(mockAnnotation);
		});
	});

	describe("list", () => {
		it("returns paginated list of annotations", async () => {
			const mockAnnotations = [makeAnnotation(), makeAnnotation()];
			vi.mocked(listAnnotations).mockResolvedValue(mockAnnotations);

			const ctx = createTestContext();
			const result = await call(
				annotationsRouter.list,
				{ page: 1, limit: 50 },
				{ context: ctx },
			);

			expect(listAnnotations).toHaveBeenCalledWith(
				expect.anything(),
				TEST_ORG_ID,
				expect.objectContaining({ page: 1, limit: 50 }),
			);
			expect(result).toEqual({
				items: mockAnnotations,
				page: 1,
				limit: 50,
			});
		});

		it("returns empty items array when no annotations exist", async () => {
			vi.mocked(listAnnotations).mockResolvedValue([]);

			const ctx = createTestContext();
			const result = await call(
				annotationsRouter.list,
				{ page: 1, limit: 50 },
				{ context: ctx },
			);

			expect(result.items).toEqual([]);
		});
	});

	describe("getById", () => {
		it("returns annotation by id", async () => {
			const mockAnnotation = makeAnnotation();
			vi.mocked(getAnnotation).mockResolvedValue(mockAnnotation);

			const ctx = createTestContext();
			const result = await call(
				annotationsRouter.getById,
				{ id: ANNOTATION_ID },
				{ context: ctx },
			);

			expect(getAnnotation).toHaveBeenCalledWith(
				expect.anything(),
				ANNOTATION_ID,
			);
			expect(result).toEqual(mockAnnotation);
		});

		it("throws NOT_FOUND when annotation does not exist", async () => {
			vi.mocked(getAnnotation).mockResolvedValue(null as any);

			const ctx = createTestContext();
			await expect(
				call(
					annotationsRouter.getById,
					{ id: ANNOTATION_ID },
					{ context: ctx },
				),
			).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
		});

		it("throws NOT_FOUND when annotation belongs to different organization", async () => {
			const mockAnnotation = makeAnnotation({
				organizationId: "different-org-id",
			});
			vi.mocked(getAnnotation).mockResolvedValue(mockAnnotation);

			const ctx = createTestContext();
			await expect(
				call(
					annotationsRouter.getById,
					{ id: ANNOTATION_ID },
					{ context: ctx },
				),
			).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
		});
	});

	describe("update", () => {
		it("updates annotation", async () => {
			const mockAnnotation = makeAnnotation();
			vi.mocked(getAnnotation).mockResolvedValue(mockAnnotation);
			vi.mocked(updateAnnotation).mockResolvedValue({
				...mockAnnotation,
				title: "Updated Title",
			});

			const ctx = createTestContext();
			const result = await call(
				annotationsRouter.update,
				{
					id: ANNOTATION_ID,
					title: "Updated Title",
					description: "Updated description",
				},
				{ context: ctx },
			);

			expect(getAnnotation).toHaveBeenCalledWith(
				expect.anything(),
				ANNOTATION_ID,
			);
			expect(updateAnnotation).toHaveBeenCalledWith(
				expect.anything(),
				ANNOTATION_ID,
				{
					title: "Updated Title",
					description: "Updated description",
				},
			);
			expect(result.title).toBe("Updated Title");
		});

		it("throws NOT_FOUND when annotation belongs to different organization", async () => {
			const mockAnnotation = makeAnnotation({
				organizationId: "different-org-id",
			});
			vi.mocked(getAnnotation).mockResolvedValue(mockAnnotation);

			const ctx = createTestContext();
			await expect(
				call(
					annotationsRouter.update,
					{
						id: ANNOTATION_ID,
						title: "Updated Title",
					},
					{ context: ctx },
				),
			).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
		});
	});

	describe("remove", () => {
		it("deletes annotation", async () => {
			const mockAnnotation = makeAnnotation();
			vi.mocked(getAnnotation).mockResolvedValue(mockAnnotation);
			vi.mocked(deleteAnnotation).mockResolvedValue(undefined);

			const ctx = createTestContext();
			await call(
				annotationsRouter.remove,
				{ id: ANNOTATION_ID },
				{ context: ctx },
			);

			expect(getAnnotation).toHaveBeenCalledWith(
				expect.anything(),
				ANNOTATION_ID,
			);
			expect(deleteAnnotation).toHaveBeenCalledWith(
				expect.anything(),
				ANNOTATION_ID,
			);
		});

		it("throws NOT_FOUND when annotation belongs to different organization", async () => {
			const mockAnnotation = makeAnnotation({
				organizationId: "different-org-id",
			});
			vi.mocked(getAnnotation).mockResolvedValue(mockAnnotation);

			const ctx = createTestContext();
			await expect(
				call(
					annotationsRouter.remove,
					{ id: ANNOTATION_ID },
					{ context: ctx },
				),
			).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
		});
	});
});
