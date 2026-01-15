import { serverEnv } from "@packages/environment/server";
import { queryAIUsage, queryExtendedUsage } from "@packages/posthog/analytics";
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

      try {
         const usage = await queryAIUsage(
            serverEnv.POSTHOG_HOST,
            serverEnv.POSTHOG_PERSONAL_API_KEY,
            serverEnv.POSTHOG_PROJECT_ID,
            {
               organizationId,
               startDate: startOfMonth,
               endDate: endOfMonth,
            },
         );

         return usage;
      } catch (error) {
         console.error("Failed to fetch AI usage:", error);
         // Return empty stats on error rather than failing
         return {
            period: `${startOfMonth.toISOString().split("T")[0]} - ${endOfMonth.toISOString().split("T")[0]}`,
            totalRequests: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
            byFeature: {
               fim: {
                  requests: 0,
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,
               },
               chat: {
                  requests: 0,
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,
               },
               edit: {
                  requests: 0,
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,
               },
               plan: {
                  requests: 0,
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,
               },
            },
         };
      }
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

      try {
         const usage = await queryExtendedUsage(
            serverEnv.POSTHOG_HOST,
            serverEnv.POSTHOG_PERSONAL_API_KEY,
            serverEnv.POSTHOG_PROJECT_ID,
            {
               organizationId,
               startDate: startOfMonth,
               endDate: endOfMonth,
               previousMonthStart: startOfPrevMonth,
               previousMonthEnd: endOfPrevMonth,
            },
         );

         return usage;
      } catch (error) {
         console.error("Failed to fetch extended AI usage:", error);
         // Return empty stats on error rather than failing
         return {
            period: `${startOfMonth.toISOString().split("T")[0]} - ${endOfMonth.toISOString().split("T")[0]}`,
            totalRequests: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
            byFeature: {
               fim: {
                  requests: 0,
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,
               },
               chat: {
                  requests: 0,
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,
               },
               edit: {
                  requests: 0,
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,
               },
               plan: {
                  requests: 0,
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,
               },
            },
            dailyUsage: [],
            acceptanceRates: [],
            previousMonth: { totalRequests: 0, totalTokens: 0 },
            comparison: { requestsChange: 0, tokensChange: 0 },
         };
      }
   }),
});
