import {
	querySDKUsage,
	querySDKUsageByMonth,
} from "@packages/posthog/analytics/sdk-usage-query";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// SDK Usage Procedures
// =============================================================================

/**
 * Get SDK usage statistics for the organization
 */
export const getSDKUsage = protectedProcedure
	.input(
		z.object({
			startDate: z.coerce.date(),
			endDate: z.coerce.date(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { organizationId } = context;

		return await querySDKUsage({
			organizationId,
			startDate: input.startDate,
			endDate: input.endDate,
		});
	});

/**
 * Get SDK usage statistics for the current month
 */
export const getCurrentMonthSDKUsage = protectedProcedure.handler(
	async ({ context }) => {
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

		return await querySDKUsage({
			organizationId,
			startDate,
			endDate,
		});
	},
);

/**
 * Get SDK usage statistics grouped by month
 */
export const getSDKUsageByMonth = protectedProcedure
	.input(
		z.object({
			startDate: z.coerce.date(),
			endDate: z.coerce.date(),
		}),
	)
	.handler(async ({ context, input }) => {
		const { organizationId } = context;

		return await querySDKUsageByMonth({
			organizationId,
			startDate: input.startDate,
			endDate: input.endDate,
		});
	});
