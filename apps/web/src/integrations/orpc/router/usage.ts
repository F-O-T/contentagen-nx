import { dailyEventCounts, monthlyAiUsage } from "@packages/database/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { protectedProcedure } from "../server";

// =============================================================================
// Usage Procedures
// =============================================================================

/**
 * Get AI usage statistics for the current month
 */
export const getCurrentMonthUsage = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId } = context;

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const rows = await db
         .select()
         .from(monthlyAiUsage)
         .where(
            and(
               eq(monthlyAiUsage.organizationId, organizationId),
               eq(monthlyAiUsage.month, currentMonth),
            ),
         );

      return (
         rows[0] ?? {
            organizationId,
            month: currentMonth,
            completions: 0,
            chatMessages: 0,
            agentActions: 0,
            totalTokens: 0,
            promptTokens: 0,
            completionTokens: 0,
            avgLatencyMs: null,
         }
      );
   },
);

/**
 * Get extended AI usage statistics with charts data
 * Includes daily usage, acceptance rates, and month-over-month comparison
 */
export const getExtendedUsage = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId } = context;

      const now = new Date();
      const currentMonthDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthDate = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}-01`;

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const today = now.toISOString().split("T")[0];
      const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

      const [currentMonth, previousMonth, dailyBreakdown] = await Promise.all([
         db
            .select()
            .from(monthlyAiUsage)
            .where(
               and(
                  eq(monthlyAiUsage.organizationId, organizationId),
                  eq(monthlyAiUsage.month, currentMonthDate),
               ),
            ),
         db
            .select()
            .from(monthlyAiUsage)
            .where(
               and(
                  eq(monthlyAiUsage.organizationId, organizationId),
                  eq(monthlyAiUsage.month, prevMonthDate),
               ),
            ),
         db
            .select()
            .from(dailyEventCounts)
            .where(
               and(
                  eq(dailyEventCounts.organizationId, organizationId),
                  eq(dailyEventCounts.eventCategory, "ai"),
                  gte(dailyEventCounts.date, startOfMonthStr),
                  lte(dailyEventCounts.date, today),
               ),
            )
            .orderBy(dailyEventCounts.date),
      ]);

      return {
         current: currentMonth[0] ?? null,
         previous: previousMonth[0] ?? null,
         daily: dailyBreakdown,
      };
   },
);
