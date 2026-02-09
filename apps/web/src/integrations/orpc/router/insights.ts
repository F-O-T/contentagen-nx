import { ORPCError } from "@orpc/server";
import {
	createInsight,
	deleteInsight,
	getInsightById,
	listInsights,
	updateInsight,
} from "@packages/database/repositories/insight-repository";
import {
	emitInsightCreated,
	emitInsightDeleted,
	emitInsightUpdated,
} from "@packages/events/insight";
import { z } from "zod";
import { protectedProcedure } from "../server";

const insightConfigSchema = z.record(z.string(), z.unknown());

const createInsightSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	type: z.enum(["trends", "funnels", "retention"]),
	config: insightConfigSchema,
	defaultSize: z.enum(["sm", "md", "lg", "full"]).optional().default("md"),
});

const updateInsightSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	config: insightConfigSchema.optional(),
	defaultSize: z.enum(["sm", "md", "lg", "full"]).optional(),
});

export const create = protectedProcedure
	.input(createInsightSchema)
	.handler(async ({ context, input }) => {
		const { organizationId, userId, db, posthog, teamId } = context;

		const insight = await createInsight(db, {
			organizationId,
			createdBy: userId,
			name: input.name,
			description: input.description,
			type: input.type,
			config: input.config,
			defaultSize: input.defaultSize,
		});

		try {
			await emitInsightCreated(
				{ db, posthog, organizationId, userId, teamId },
				{ insightId: insight.id, name: input.name },
			);
		} catch {
			// Event emission must not break the main flow
		}

		return insight;
	});

export const list = protectedProcedure
	.input(
		z
			.object({
				type: z.enum(["trends", "funnels", "retention"]).optional(),
			})
			.optional(),
	)
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;
		return await listInsights(db, organizationId, input?.type);
	});

export const getById = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;
		const insight = await getInsightById(db, input.id);

		if (!insight || insight.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Insight not found.",
			});
		}

		return insight;
	});

export const update = protectedProcedure
	.input(updateInsightSchema)
	.handler(async ({ context, input }) => {
		const { organizationId, db, posthog, userId, teamId } = context;
		const insight = await getInsightById(db, input.id);

		if (!insight || insight.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Insight not found.",
			});
		}

		const { id: _, ...updateData } = input;
		const updated = await updateInsight(db, input.id, updateData);

		try {
			const changedFields = Object.keys(updateData).filter(
				(k) => updateData[k as keyof typeof updateData] !== undefined,
			);
			await emitInsightUpdated(
				{ db, posthog, organizationId, userId, teamId },
				{ insightId: input.id, changedFields },
			);
		} catch {
			// Event emission must not break the main flow
		}

		return updated;
	});

export const remove = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { organizationId, db, posthog, userId, teamId } = context;
		const insight = await getInsightById(db, input.id);

		if (!insight || insight.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Insight not found.",
			});
		}

		await deleteInsight(db, input.id);

		try {
			await emitInsightDeleted(
				{ db, posthog, organizationId, userId, teamId },
				{ insightId: input.id },
			);
		} catch {
			// Event emission must not break the main flow
		}

		return { success: true };
	});
