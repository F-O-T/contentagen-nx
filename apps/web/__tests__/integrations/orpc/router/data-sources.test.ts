import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ORPCError } from "@orpc/server";

vi.mock("@packages/database/repositories/data-source-repository");

import {
	createDataSource,
	deleteDataSource,
	getDataSource,
	listDataSources,
	updateDataSource,
} from "@packages/database/repositories/data-source-repository";
import * as dataSourcesRouter from "@/integrations/orpc/router/data-sources";
import {
	DATA_SOURCE_ID,
	makeDataSource,
} from "../../../helpers/mock-factories";
import { TEST_ORG_ID, createTestContext } from "../../../helpers/create-test-context";

describe("data-sources router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		it("creates data source with name, type, description, and config", async () => {
			const mockDataSource = makeDataSource();
			vi.mocked(createDataSource).mockResolvedValue(mockDataSource);

			const ctx = createTestContext();
			const result = await call(
				dataSourcesRouter.create,
				{
					name: "My SDK Source",
					type: "sdk",
					description: "Test SDK source",
					config: { apiKey: "test-key" },
				},
				{ context: ctx },
			);

			expect(createDataSource).toHaveBeenCalledWith(expect.anything(), {
				name: "My SDK Source",
				type: "sdk",
				description: "Test SDK source",
				config: { apiKey: "test-key" },
				organizationId: TEST_ORG_ID,
			});
			expect(result).toEqual(mockDataSource);
		});
	});

	describe("list", () => {
		it("returns list of data sources", async () => {
			const mockDataSources = [makeDataSource(), makeDataSource()];
			vi.mocked(listDataSources).mockResolvedValue(mockDataSources);

			const ctx = createTestContext();
			const result = await call(
				dataSourcesRouter.list,
				undefined,
				{ context: ctx },
			);

			expect(listDataSources).toHaveBeenCalledWith(
				expect.anything(),
				TEST_ORG_ID,
			);
			expect(result).toEqual(mockDataSources);
		});

		it("returns empty array when no data sources exist", async () => {
			vi.mocked(listDataSources).mockResolvedValue([]);

			const ctx = createTestContext();
			const result = await call(
				dataSourcesRouter.list,
				undefined,
				{ context: ctx },
			);

			expect(result).toEqual([]);
		});
	});

	describe("getById", () => {
		it("returns data source by id", async () => {
			const mockDataSource = makeDataSource();
			vi.mocked(getDataSource).mockResolvedValue(mockDataSource);

			const ctx = createTestContext();
			const result = await call(
				dataSourcesRouter.getById,
				{ id: DATA_SOURCE_ID },
				{ context: ctx },
			);

			expect(getDataSource).toHaveBeenCalledWith(
				expect.anything(),
				DATA_SOURCE_ID,
			);
			expect(result).toEqual(mockDataSource);
		});

		it("throws NOT_FOUND when data source does not exist", async () => {
			vi.mocked(getDataSource).mockResolvedValue(null as any);

			const ctx = createTestContext();
			await expect(
				call(
					dataSourcesRouter.getById,
					{ id: DATA_SOURCE_ID },
					{ context: ctx },
				),
			).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
		});

		it("throws NOT_FOUND when data source belongs to different organization", async () => {
			const mockDataSource = makeDataSource({
				organizationId: "different-org-id",
			});
			vi.mocked(getDataSource).mockResolvedValue(mockDataSource);

			const ctx = createTestContext();
			await expect(
				call(
					dataSourcesRouter.getById,
					{ id: DATA_SOURCE_ID },
					{ context: ctx },
				),
			).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
		});
	});

	describe("update", () => {
		it("updates data source", async () => {
			const mockDataSource = makeDataSource();
			vi.mocked(getDataSource).mockResolvedValue(mockDataSource);
			vi.mocked(updateDataSource).mockResolvedValue({
				...mockDataSource,
				name: "Updated Name",
			});

			const ctx = createTestContext();
			const result = await call(
				dataSourcesRouter.update,
				{
					id: DATA_SOURCE_ID,
					name: "Updated Name",
					description: "Updated description",
				},
				{ context: ctx },
			);

			expect(getDataSource).toHaveBeenCalledWith(
				expect.anything(),
				DATA_SOURCE_ID,
			);
			expect(updateDataSource).toHaveBeenCalledWith(
				expect.anything(),
				DATA_SOURCE_ID,
				{
					name: "Updated Name",
					description: "Updated description",
				},
			);
			expect(result.name).toBe("Updated Name");
		});

		it("throws NOT_FOUND when data source belongs to different organization", async () => {
			const mockDataSource = makeDataSource({
				organizationId: "different-org-id",
			});
			vi.mocked(getDataSource).mockResolvedValue(mockDataSource);

			const ctx = createTestContext();
			await expect(
				call(
					dataSourcesRouter.update,
					{
						id: DATA_SOURCE_ID,
						name: "Updated Name",
					},
					{ context: ctx },
				),
			).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
		});
	});

	describe("remove", () => {
		it("deletes data source", async () => {
			const mockDataSource = makeDataSource();
			vi.mocked(getDataSource).mockResolvedValue(mockDataSource);
			vi.mocked(deleteDataSource).mockResolvedValue(undefined);

			const ctx = createTestContext();
			await call(
				dataSourcesRouter.remove,
				{ id: DATA_SOURCE_ID },
				{ context: ctx },
			);

			expect(getDataSource).toHaveBeenCalledWith(
				expect.anything(),
				DATA_SOURCE_ID,
			);
			expect(deleteDataSource).toHaveBeenCalledWith(
				expect.anything(),
				DATA_SOURCE_ID,
			);
		});

		it("throws NOT_FOUND when data source belongs to different organization", async () => {
			const mockDataSource = makeDataSource({
				organizationId: "different-org-id",
			});
			vi.mocked(getDataSource).mockResolvedValue(mockDataSource);

			const ctx = createTestContext();
			await expect(
				call(
					dataSourcesRouter.remove,
					{ id: DATA_SOURCE_ID },
					{ context: ctx },
				),
			).rejects.toSatisfy((e: ORPCError<string, unknown>) => e.code === "NOT_FOUND");
		});
	});
});
