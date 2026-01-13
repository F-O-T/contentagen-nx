import { serverEnv } from "@packages/environment/server";
import { queryAIUsage } from "@packages/posthog/analytics";
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
               fim: { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
               chat: { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
               edit: { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
               plan: { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            },
         };
      }
   }),
});
