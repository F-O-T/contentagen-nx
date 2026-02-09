import { ORPCError, call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TEST_ORG_ID,
	TEST_TEAM_ID,
	TEST_USER_ID,
	createTestContext,
} from "../../../helpers/create-test-context";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches the modules
// ---------------------------------------------------------------------------

vi.mock("@packages/database/repositories/dashboard-repository");
vi.mock("@packages/events/dashboard");

import {
	createDashboard,
	deleteDashboard,
	getDashboardById,
	listDashboards,
	updateDashboard,
	updateDashboardTiles,
} from "@packages/database/repositories/dashboard-repository";
import {
	emitDashboardCreated,
	emitDashboardDeleted,
	emitDashboardUpdated,
} from "@packages/events/dashboard";

import * as dashboardsRouter from "@/integrations/orpc/router/dashboards";

// ---------------------------------------------------------------------------
// Mock Helpers
// ---------------------------------------------------------------------------

const DASHBOARD_ID = "d0d0d0d0-e1e1-4f2f-a3a3-b4b4b4b4b4b4";

function makeDashboard(overrides: Record<string, unknown> = {}) {
	return {
		id: DASHBOARD_ID,
		organizationId: TEST_ORG_ID,
		name: "My Dashboard",
		description: "Test dashboard",
		createdBy: TEST_USER_ID,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(emitDashboardCreated).mockResolvedValue(undefined);
	vi.mocked(emitDashboardUpdated).mockResolvedValue(undefined);
	vi.mocked(emitDashboardDeleted).mockResolvedValue(undefined);
});

// =============================================================================
// create
// =============================================================================

describe("create", () => {
	const input = {
		name: "My Dashboard",
		description: "Test dashboard",
	};

	it("creates dashboard successfully", async () => {
		const dashboard = makeDashboard();
		vi.mocked(createDashboard).mockResolvedValueOnce(dashboard as any);

		const ctx = createTestContext();
		const result = await call(dashboardsRouter.create, input, {
			context: ctx,
		});

		expect(createDashboard).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				createdBy: TEST_USER_ID,
				name: input.name,
				description: input.description,
			}),
		);
		expect(result).toEqual(dashboard);
	});

	it("emits dashboard.created event with correct params", async () => {
		const dashboard = makeDashboard();
		vi.mocked(createDashboard).mockResolvedValueOnce(dashboard as any);

		const ctx = createTestContext();
		await call(dashboardsRouter.create, input, { context: ctx });

		expect(emitDashboardCreated).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				dashboardId: DASHBOARD_ID,
				name: input.name,
			}),
		);
	});

	it("succeeds even when event emission fails", async () => {
		const dashboard = makeDashboard();
		vi.mocked(createDashboard).mockResolvedValueOnce(dashboard as any);
		vi.mocked(emitDashboardCreated).mockRejectedValueOnce(
			new Error("emit failed"),
		);

		const ctx = createTestContext();
		const result = await call(dashboardsRouter.create, input, {
			context: ctx,
		});

		expect(result).toEqual(dashboard);
	});
});

// =============================================================================
// list
// =============================================================================

describe("list", () => {
	it("returns list of dashboards", async () => {
		const dashboards = [
			makeDashboard(),
			makeDashboard({ id: "dashboard-2", name: "Second Dashboard" }),
		];
		vi.mocked(listDashboards).mockResolvedValueOnce(dashboards as any);

		const ctx = createTestContext();
		const result = await call(dashboardsRouter.list, undefined, {
			context: ctx,
		});

		expect(listDashboards).toHaveBeenCalledWith(
			expect.anything(),
			TEST_ORG_ID,
		);
		expect(result).toHaveLength(2);
	});
});

// =============================================================================
// getById
// =============================================================================

describe("getById", () => {
	it("returns dashboard by id", async () => {
		const dashboard = makeDashboard();
		vi.mocked(getDashboardById).mockResolvedValueOnce(dashboard as any);

		const ctx = createTestContext();
		const result = await call(
			dashboardsRouter.getById,
			{ id: DASHBOARD_ID },
			{ context: ctx },
		);

		expect(getDashboardById).toHaveBeenCalledWith(
			expect.anything(),
			DASHBOARD_ID,
		);
		expect(result).toEqual(dashboard);
	});

	it("throws NOT_FOUND when dashboard does not exist", async () => {
		vi.mocked(getDashboardById).mockResolvedValueOnce(null as any);

		const ctx = createTestContext();
		await expect(
			call(
				dashboardsRouter.getById,
				{ id: DASHBOARD_ID },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: any) => e.code === "NOT_FOUND");
	});

	it("throws NOT_FOUND when dashboard belongs to different org", async () => {
		const dashboard = makeDashboard({ organizationId: "other-org-id" });
		vi.mocked(getDashboardById).mockResolvedValueOnce(dashboard as any);

		const ctx = createTestContext();
		await expect(
			call(
				dashboardsRouter.getById,
				{ id: DASHBOARD_ID },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: any) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// update
// =============================================================================

describe("update", () => {
	const input = {
		id: DASHBOARD_ID,
		name: "Updated Dashboard",
		description: "Updated description",
	};

	it("updates dashboard successfully and emits event", async () => {
		vi.mocked(getDashboardById).mockResolvedValueOnce(
			makeDashboard() as any,
		);
		const updated = makeDashboard({
			name: "Updated Dashboard",
			description: "Updated description",
		});
		vi.mocked(updateDashboard).mockResolvedValueOnce(updated as any);

		const ctx = createTestContext();
		const result = await call(dashboardsRouter.update, input, {
			context: ctx,
		});

		expect(updateDashboard).toHaveBeenCalledWith(
			expect.anything(),
			DASHBOARD_ID,
			expect.objectContaining({
				name: "Updated Dashboard",
				description: "Updated description",
			}),
		);
		expect(result).toEqual(updated);
	});

	it("throws NOT_FOUND when dashboard does not exist", async () => {
		vi.mocked(getDashboardById).mockResolvedValueOnce(null as any);

		const ctx = createTestContext();
		await expect(
			call(dashboardsRouter.update, input, { context: ctx }),
		).rejects.toSatisfy((e: any) => e.code === "NOT_FOUND");
	});

	it("emits dashboard.updated with correct changedFields", async () => {
		vi.mocked(getDashboardById).mockResolvedValueOnce(
			makeDashboard() as any,
		);
		vi.mocked(updateDashboard).mockResolvedValueOnce(
			makeDashboard() as any,
		);

		const ctx = createTestContext();
		await call(dashboardsRouter.update, input, { context: ctx });

		expect(emitDashboardUpdated).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				dashboardId: DASHBOARD_ID,
				changedFields: expect.arrayContaining([
					"name",
					"description",
				]),
			}),
		);
	});
});

// =============================================================================
// updateTiles
// =============================================================================

describe("updateTiles", () => {
	const input = {
		id: DASHBOARD_ID,
		tiles: [
			{
				insightId: "a1a1a1a1-b2b2-4c3c-9d4d-e5e5e5e5e5e5",
				size: "md" as const,
				order: 0,
			},
		],
	};

	it("updates tiles successfully", async () => {
		vi.mocked(getDashboardById).mockResolvedValueOnce(
			makeDashboard() as any,
		);
		const tilesResult = { success: true };
		vi.mocked(updateDashboardTiles).mockResolvedValueOnce(
			tilesResult as any,
		);

		const ctx = createTestContext();
		const result = await call(dashboardsRouter.updateTiles, input, {
			context: ctx,
		});

		expect(updateDashboardTiles).toHaveBeenCalledWith(
			expect.anything(),
			DASHBOARD_ID,
			input.tiles,
		);
		expect(result).toEqual(tilesResult);
	});

	it("throws NOT_FOUND when dashboard does not exist", async () => {
		vi.mocked(getDashboardById).mockResolvedValueOnce(null as any);

		const ctx = createTestContext();
		await expect(
			call(dashboardsRouter.updateTiles, input, { context: ctx }),
		).rejects.toSatisfy((e: any) => e.code === "NOT_FOUND");
	});
});

// =============================================================================
// remove
// =============================================================================

describe("remove", () => {
	it("deletes dashboard and emits event", async () => {
		vi.mocked(getDashboardById).mockResolvedValueOnce(
			makeDashboard() as any,
		);
		vi.mocked(deleteDashboard).mockResolvedValueOnce(undefined as any);

		const ctx = createTestContext();
		const result = await call(
			dashboardsRouter.remove,
			{ id: DASHBOARD_ID },
			{ context: ctx },
		);

		expect(deleteDashboard).toHaveBeenCalledWith(
			expect.anything(),
			DASHBOARD_ID,
		);
		expect(result).toEqual({ success: true });

		expect(emitDashboardDeleted).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				teamId: TEST_TEAM_ID,
			}),
			expect.objectContaining({
				dashboardId: DASHBOARD_ID,
			}),
		);
	});

	it("throws NOT_FOUND when dashboard does not exist", async () => {
		vi.mocked(getDashboardById).mockResolvedValueOnce(null as any);

		const ctx = createTestContext();
		await expect(
			call(
				dashboardsRouter.remove,
				{ id: DASHBOARD_ID },
				{ context: ctx },
			),
		).rejects.toSatisfy((e: any) => e.code === "NOT_FOUND");
	});
});
