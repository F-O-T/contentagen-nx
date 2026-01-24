import {
	queryContentAnalytics,
	queryTopContent,
	queryTrafficSources,
	queryEngagementFunnel,
} from "@packages/posthog/analytics/content-analytics-query";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Content Analytics Procedures
// =============================================================================

/**
 * Get analytics for specific content or all content in organization
 */
export const getContentAnalytics = protectedProcedure
	.input(
		z.object({
			contentId: z.string().uuid().optional(),
			startDate: z.coerce.date(),
			endDate: z.coerce.date(),
			granularity: z.enum(["daily", "weekly", "monthly"]).default("daily"),
		}),
	)
	.handler(async ({ context, input }) => {
		const { organizationId } = context;

		return await queryContentAnalytics({
			organizationId,
			contentId: input.contentId,
			startDate: input.startDate,
			endDate: input.endDate,
			granularity: input.granularity,
		});
	});

/**
 * Get analytics for the current month
 */
export const getCurrentMonthContentAnalytics = protectedProcedure
	.input(
		z.object({
			contentId: z.string().uuid().optional(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { organizationId } = context;
		const now = new Date();
		const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
		const endDate = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			0,
			23,
			59,
			59,
			999,
		);

		return await queryContentAnalytics({
			organizationId,
			contentId: input.contentId,
			startDate,
			endDate,
			granularity: "daily",
		});
	});

/**
 * Get top performing content
 */
export const getTopContent = protectedProcedure
	.input(
		z.object({
			sortBy: z.enum(["views", "engagement", "conversions"]).default("views"),
			limit: z.number().min(1).max(50).default(10),
			startDate: z.coerce.date(),
			endDate: z.coerce.date(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { organizationId } = context;

		return await queryTopContent({
			organizationId,
			sortBy: input.sortBy,
			limit: input.limit,
			startDate: input.startDate,
			endDate: input.endDate,
		});
	});

/**
 * Get traffic source breakdown
 */
export const getTrafficSources = protectedProcedure
	.input(
		z.object({
			contentId: z.string().uuid().optional(),
			startDate: z.coerce.date(),
			endDate: z.coerce.date(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { organizationId } = context;

		return await queryTrafficSources({
			organizationId,
			contentId: input.contentId,
			startDate: input.startDate,
			endDate: input.endDate,
		});
	});

/**
 * Get engagement funnel for specific content
 */
export const getEngagementFunnel = protectedProcedure
	.input(
		z.object({
			contentId: z.string().uuid(),
			startDate: z.coerce.date(),
			endDate: z.coerce.date(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { organizationId } = context;

		return await queryEngagementFunnel({
			organizationId,
			contentId: input.contentId,
			startDate: input.startDate,
			endDate: input.endDate,
		});
	});
