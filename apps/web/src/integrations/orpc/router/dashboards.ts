import { ORPCError } from "@orpc/server";
import {
	createDashboard,
	deleteDashboard,
	getDashboardById,
	listDashboards,
	updateDashboard,
	updateDashboardTiles,
} from "@packages/database/repositories/dashboard-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

const tileSchema = z.object({
	insightId: z.string().uuid(),
	size: z.enum(["sm", "md", "lg", "full"]),
	order: z.number().int().min(0),
});

const createDashboardSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
});

const updateDashboardSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
});

const updateTilesSchema = z.object({
	id: z.string().uuid(),
	tiles: z.array(tileSchema),
});

export const create = protectedProcedure
	.input(createDashboardSchema)
	.handler(async ({ context, input }) => {
		const { organizationId, userId, db } = context;

		return await createDashboard(db, {
			organizationId,
			createdBy: userId,
			name: input.name,
			description: input.description,
		});
	});

export const list = protectedProcedure.handler(async ({ context }) => {
	const { organizationId, db } = context;
	return await listDashboards(db, organizationId);
});

export const getById = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;
		const dashboard = await getDashboardById(db, input.id);

		if (!dashboard || dashboard.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Dashboard not found.",
			});
		}

		return dashboard;
	});

export const update = protectedProcedure
	.input(updateDashboardSchema)
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;
		const dashboard = await getDashboardById(db, input.id);

		if (!dashboard || dashboard.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Dashboard not found.",
			});
		}

		const { id: _, ...updateData } = input;
		return await updateDashboard(db, input.id, updateData);
	});

export const updateTiles = protectedProcedure
	.input(updateTilesSchema)
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;
		const dashboard = await getDashboardById(db, input.id);

		if (!dashboard || dashboard.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Dashboard not found.",
			});
		}

		return await updateDashboardTiles(db, input.id, input.tiles);
	});

export const remove = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;
		const dashboard = await getDashboardById(db, input.id);

		if (!dashboard || dashboard.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Dashboard not found.",
			});
		}

		await deleteDashboard(db, input.id);
		return { success: true };
	});
