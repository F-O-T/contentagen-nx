import { ORPCError } from "@orpc/server";
import {
	addRelatedContent,
	getRelatedContentBySourceId,
	removeRelatedContent,
	updateRelatedContentOrder,
} from "@packages/database/repositories/related-content-repository";
import { getContentById } from "@packages/database/repositories/content-repository";
import { emitClusterSatelliteAdded, emitClusterSatelliteRemoved } from "@packages/events/clusters";
import { createEmitFn } from "@packages/events/emit";
import { z } from "zod";
import { protectedProcedure } from "../server";

/**
 * Add a satellite post to a pillar (source → target).
 */
export const addSatellite = protectedProcedure
	.input(
		z.object({
			pillarId: z.string().uuid(),
			satelliteId: z.string().uuid(),
			relationType: z.enum(["manual", "ai_suggested"]).default("manual"),
		}),
	)
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId, teamId, posthog } = context;

		const [pillar, satellite] = await Promise.all([
			getContentById(db, input.pillarId),
			getContentById(db, input.satelliteId),
		]);

		if (!pillar || pillar.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
		}
		if (!satellite || satellite.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Satellite not found." });
		}

		const result = await addRelatedContent(db, {
			sourceContentId: input.pillarId,
			targetContentId: input.satelliteId,
			relationType: input.relationType,
		});

		try {
			await emitClusterSatelliteAdded(
				createEmitFn(db, posthog),
				{ organizationId, userId, teamId },
				{
					clusterId: input.pillarId,
					satelliteId: input.satelliteId,
					relationType: input.relationType,
				},
			);
		} catch {
			// Event emission must not break the main flow
		}

		return result;
	});

/**
 * Remove a satellite from a pillar.
 */
export const removeSatellite = protectedProcedure
	.input(
		z.object({
			pillarId: z.string().uuid(),
			satelliteId: z.string().uuid(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { db, organizationId, userId, teamId, posthog } = context;

		const pillar = await getContentById(db, input.pillarId);
		if (!pillar || pillar.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
		}

		const result = await removeRelatedContent(db, input.pillarId, input.satelliteId);

		try {
			await emitClusterSatelliteRemoved(
				createEmitFn(db, posthog),
				{ organizationId, userId, teamId },
				{
					clusterId: input.pillarId,
					satelliteId: input.satelliteId,
				},
			);
		} catch {
			// Event emission must not break the main flow
		}

		return result;
	});

/**
 * List satellites for a given pillar, with target content metadata.
 */
export const listSatellites = protectedProcedure
	.input(z.object({ pillarId: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;

		const pillar = await getContentById(db, input.pillarId);
		if (!pillar || pillar.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
		}

		return getRelatedContentBySourceId(db, input.pillarId);
	});

/**
 * Reorder satellites within a pillar.
 */
export const reorderSatellites = protectedProcedure
	.input(
		z.object({
			pillarId: z.string().uuid(),
			orderedSatelliteIds: z.array(z.string().uuid()),
		}),
	)
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;

		const pillar = await getContentById(db, input.pillarId);
		if (!pillar || pillar.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
		}

		return updateRelatedContentOrder(
			db,
			input.pillarId,
			input.orderedSatelliteIds,
		);
	});
