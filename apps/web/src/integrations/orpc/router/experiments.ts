import { ORPCError } from "@orpc/server";
import {
	addVariant,
	createExperiment,
	deleteExperiment,
	getExperimentById,
	getVariantsByExperiment,
	listExperimentsByTeam,
	removeVariant,
	updateExperiment,
} from "@packages/database/repositories/experiments-repository";
import { experimentDailyStats } from "@packages/database/schemas/event-views";
import { experimentVariants } from "@packages/database/schemas/experiments";
import { EXPERIMENT_TARGET_TYPES } from "@packages/events/experiments";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Schemas
// =============================================================================

const createExperimentSchema = z.object({
	name: z.string().min(1),
	hypothesis: z.string().optional(),
	targetType: z.enum(EXPERIMENT_TARGET_TYPES),
	goal: z.enum(["conversion", "ctr", "time_on_page", "form_submit"]),
});

const updateExperimentSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
	hypothesis: z.string().optional(),
	goal: z
		.enum(["conversion", "ctr", "time_on_page", "form_submit"])
		.optional(),
});

const addVariantSchema = z.object({
	experimentId: z.string().uuid(),
	name: z.string().min(1),
	isControl: z.boolean().default(false),
	contentId: z.string().uuid().optional(),
	formId: z.string().uuid().optional(),
});

// =============================================================================
// Procedures
// =============================================================================

export const list = protectedProcedure
	.input(z.object({}))
	.handler(async ({ context }) => {
		const { db, teamId } = context;
		return listExperimentsByTeam(db, teamId);
	});

export const getById = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;
		const experiment = await getExperimentById(db, input.id);
		if (!experiment || experiment.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
		}
		return experiment;
	});

export const create = protectedProcedure
	.input(createExperimentSchema)
	.handler(async ({ context, input }) => {
		const { db, organizationId, teamId } = context;
		return createExperiment(db, {
			...input,
			organizationId,
			teamId,
		});
	});

export const update = protectedProcedure
	.input(updateExperimentSchema)
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;
		const existing = await getExperimentById(db, input.id);
		if (!existing || existing.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
		}
		const { id, ...data } = input;
		return updateExperiment(db, id, data);
	});

export const remove = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;
		const existing = await getExperimentById(db, input.id);
		if (!existing || existing.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
		}
		if (existing.status === "running") {
			throw new ORPCError("FORBIDDEN", {
				message:
					"Cannot delete a running experiment. Pause it first.",
			});
		}
		await deleteExperiment(db, input.id);
		return { success: true };
	});

export const start = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;
		const existing = await getExperimentById(db, input.id);
		if (!existing || existing.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
		}
		if (existing.status !== "draft" && existing.status !== "paused") {
			throw new ORPCError("FORBIDDEN", {
				message: "Only draft or paused experiments can be started",
			});
		}
		return updateExperiment(db, input.id, {
			status: "running",
			startedAt: existing.startedAt ?? new Date(),
		});
	});

export const pause = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;
		const existing = await getExperimentById(db, input.id);
		if (!existing || existing.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
		}
		if (existing.status !== "running") {
			throw new ORPCError("FORBIDDEN", {
				message: "Only running experiments can be paused",
			});
		}
		return updateExperiment(db, input.id, { status: "paused" });
	});

export const conclude = protectedProcedure
	.input(
		z.object({
			id: z.string().uuid(),
			winnerId: z.string().uuid().optional(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;
		const existing = await getExperimentById(db, input.id);
		if (!existing || existing.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
		}
		if (existing.status === "concluded") {
			throw new ORPCError("FORBIDDEN", { message: "Experiment is already concluded" });
		}
		return updateExperiment(db, input.id, {
			status: "concluded",
			concludedAt: new Date(),
			winnerId: input.winnerId,
		});
	});

export const addVariantToExperiment = protectedProcedure
	.input(addVariantSchema)
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;
		const experiment = await getExperimentById(db, input.experimentId);
		if (!experiment || experiment.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
		}
		if (experiment.status === "running") {
			throw new ORPCError("FORBIDDEN", {
				message: "Cannot add variants to a running experiment",
			});
		}
		return addVariant(db, input);
	});

export const removeVariantFromExperiment = protectedProcedure
	.input(z.object({ variantId: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;
		// Verify ownership: fetch the variant's experiment and check org
		const [variant] = await db
			.select()
			.from(experimentVariants)
			.where(eq(experimentVariants.id, input.variantId))
			.limit(1);
		if (!variant) {
			throw new ORPCError("NOT_FOUND", { message: "Variant not found" });
		}
		const experiment = await getExperimentById(db, variant.experimentId);
		if (!experiment || experiment.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Variant not found" });
		}
		if (experiment.status === "running") {
			throw new ORPCError("FORBIDDEN", { message: "Cannot remove variants from a running experiment" });
		}
		await removeVariant(db, input.variantId);
		return { success: true };
	});

export const getResults = protectedProcedure
	.input(z.object({ experimentId: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { db, organizationId } = context;
		const experiment = await getExperimentById(db, input.experimentId);
		if (!experiment || experiment.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", { message: "Experiment not found" });
		}
		const variants = await getVariantsByExperiment(db, input.experimentId);

		const stats = await db
			.select()
			.from(experimentDailyStats)
			.where(
				and(
					eq(experimentDailyStats.organizationId, organizationId),
					eq(experimentDailyStats.experimentId, input.experimentId),
				),
			);

		// Aggregate by variantId
		const byVariant = variants.map((v) => {
			const variantStats = stats.filter((s) => s.variantId === v.id);
			const totalImpressions = variantStats.reduce(
				(sum, s) => sum + s.impressions,
				0,
			);
			const totalConversions = variantStats.reduce(
				(sum, s) => sum + s.conversions,
				0,
			);
			const conversionRate =
				totalImpressions > 0 ? totalConversions / totalImpressions : 0;

			return {
				variant: v,
				totalImpressions,
				totalConversions,
				conversionRate,
				isWinner: experiment.winnerId === v.id,
				dailyStats: variantStats,
			};
		});

		return {
			experiment,
			variants: byVariant,
		};
	});
