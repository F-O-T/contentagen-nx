import { ORPCError } from "@orpc/server";
import {
	createInsight,
	deleteInsight,
	getInsightById,
	listInsights,
	updateInsight,
} from "@packages/database/repositories/insight-repository";
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
		const { organizationId, userId, db } = context;

		return await createInsight(db, {
			organizationId,
			createdBy: userId,
			name: input.name,
			description: input.description,
			type: input.type,
			config: input.config,
			defaultSize: input.defaultSize,
		});
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
		const { organizationId, db } = context;
		const insight = await getInsightById(db, input.id);

		if (!insight || insight.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Insight not found.",
			});
		}

		const { id: _, ...updateData } = input;
		return await updateInsight(db, input.id, updateData);
	});

export const remove = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;
		const insight = await getInsightById(db, input.id);

		if (!insight || insight.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Insight not found.",
			});
		}

		await deleteInsight(db, input.id);
		return { success: true };
	});
