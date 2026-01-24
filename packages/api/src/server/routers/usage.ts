import {
   queryAIUsage,
   queryExtendedUsage,
} from "@packages/posthog/analytics/usage-query";
import { APIError } from "@packages/utils/errors";
import { protectedProcedure, router } from "../trpc";

export const usageRouter = router({
   /**
    * Get AI usage statistics for the current month
    */
   getCurrentMonthUsage: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      if (!organizationId) {
         throw APIError.unauthorized("No active organization");
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
         now.getFullYear(),
         now.getMonth() + 1,
         0,
         23,
         59,
         59,
         999,
      );

      return await queryAIUsage({
         organizationId,
         startDate: startOfMonth,
         endDate: endOfMonth,
      });
   }),

   /**
    * Get extended AI usage statistics with charts data
    * Includes daily usage, acceptance rates, and month-over-month comparison
    */
   getExtendedUsage: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      if (!organizationId) {
         throw APIError.unauthorized("No active organization");
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
         now.getFullYear(),
         now.getMonth() + 1,
         0,
         23,
         59,
         59,
         999,
      );

      // Previous month dates for comparison
      const startOfPrevMonth = new Date(
         now.getFullYear(),
         now.getMonth() - 1,
         1,
      );
      const endOfPrevMonth = new Date(
         now.getFullYear(),
         now.getMonth(),
         0,
         23,
         59,
         59,
         999,
      );

      return await queryExtendedUsage({
         organizationId,
         startDate: startOfMonth,
         endDate: endOfMonth,
         previousMonthStart: startOfPrevMonth,
         previousMonthEnd: endOfPrevMonth,
      });
   }),
});
