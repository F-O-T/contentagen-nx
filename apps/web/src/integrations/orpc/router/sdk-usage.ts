import { monthlySdkUsage } from "@packages/database/schema";
import { and, eq, gte, lte } from "drizzle-orm";
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
      const { db, organizationId } = context;

      const startMonth = `${input.startDate.getFullYear()}-${String(input.startDate.getMonth() + 1).padStart(2, "0")}-01`;
      const endMonth = `${input.endDate.getFullYear()}-${String(input.endDate.getMonth() + 1).padStart(2, "0")}-01`;

      const rows = await db
         .select()
         .from(monthlySdkUsage)
         .where(
            and(
               eq(monthlySdkUsage.organizationId, organizationId),
               gte(monthlySdkUsage.month, startMonth),
               lte(monthlySdkUsage.month, endMonth),
            ),
         );

      // Aggregate all rows into a single summary
      const summary = {
         authorRequests: 0,
         listRequests: 0,
         contentRequests: 0,
         imageRequests: 0,
         totalRequests: 0,
         errors: 0,
      };

      for (const row of rows) {
         summary.authorRequests += row.authorRequests;
         summary.listRequests += row.listRequests;
         summary.contentRequests += row.contentRequests;
         summary.imageRequests += row.imageRequests;
         summary.totalRequests += row.totalRequests;
         summary.errors += row.errors;
      }

      return summary;
   });

/**
 * Get SDK usage statistics for the current month
 */
export const getCurrentMonthSDKUsage = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId } = context;
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const rows = await db
         .select()
         .from(monthlySdkUsage)
         .where(
            and(
               eq(monthlySdkUsage.organizationId, organizationId),
               eq(monthlySdkUsage.month, currentMonth),
            ),
         );

      return (
         rows[0] ?? {
            organizationId,
            month: currentMonth,
            authorRequests: 0,
            listRequests: 0,
            contentRequests: 0,
            imageRequests: 0,
            totalRequests: 0,
            errors: 0,
         }
      );
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
      const { db, organizationId } = context;

      const startMonth = `${input.startDate.getFullYear()}-${String(input.startDate.getMonth() + 1).padStart(2, "0")}-01`;
      const endMonth = `${input.endDate.getFullYear()}-${String(input.endDate.getMonth() + 1).padStart(2, "0")}-01`;

      const rows = await db
         .select()
         .from(monthlySdkUsage)
         .where(
            and(
               eq(monthlySdkUsage.organizationId, organizationId),
               gte(monthlySdkUsage.month, startMonth),
               lte(monthlySdkUsage.month, endMonth),
            ),
         )
         .orderBy(monthlySdkUsage.month);

      return rows;
   });
