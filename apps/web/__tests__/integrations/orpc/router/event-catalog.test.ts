import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@packages/database/repositories/event-catalog-repository");

import {
	listEventCatalog,
	updateEventCatalogEntry,
} from "@packages/database/repositories/event-catalog-repository";
import * as eventCatalogRouter from "@/integrations/orpc/router/event-catalog";
import {
	EVENT_CATALOG_ID,
	makeEventCatalogEntry,
} from "../../../helpers/mock-factories";
import { createTestContext } from "../../../helpers/create-test-context";

describe("event-catalog router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("list", () => {
		it("returns event catalog entries", async () => {
			const mockEntries = [
				makeEventCatalogEntry(),
				makeEventCatalogEntry(),
			];
			vi.mocked(listEventCatalog).mockResolvedValue(mockEntries);

			const ctx = createTestContext();
			const result = await call(
				eventCatalogRouter.list,
				undefined,
				{ context: ctx },
			);

			expect(listEventCatalog).toHaveBeenCalledWith(expect.anything());
			expect(result).toEqual(mockEntries);
		});

		it("returns empty array when no entries exist", async () => {
			vi.mocked(listEventCatalog).mockResolvedValue([]);

			const ctx = createTestContext();
			const result = await call(
				eventCatalogRouter.list,
				undefined,
				{ context: ctx },
			);

			expect(result).toEqual([]);
		});
	});

	describe("update", () => {
		it("updates event catalog entry with displayName, description, and isActive", async () => {
			const mockEntry = makeEventCatalogEntry();
			vi.mocked(updateEventCatalogEntry).mockResolvedValue({
				...mockEntry,
				displayName: "Updated Display Name",
				description: "Updated description",
				isActive: false,
			});

			const ctx = createTestContext();
			const result = await call(
				eventCatalogRouter.update,
				{
					id: EVENT_CATALOG_ID,
					displayName: "Updated Display Name",
					description: "Updated description",
					isActive: false,
				},
				{ context: ctx },
			);

			expect(updateEventCatalogEntry).toHaveBeenCalledWith(
				expect.anything(),
				EVENT_CATALOG_ID,
				{
					displayName: "Updated Display Name",
					description: "Updated description",
					isActive: false,
				},
			);
			expect(result.displayName).toBe("Updated Display Name");
			expect(result.description).toBe("Updated description");
			expect(result.isActive).toBe(false);
		});
	});
});
