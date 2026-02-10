import { executeFunnelsQuery } from "@packages/analytics/funnels";
import {
   contentTrafficSources,
   dailyContentAnalytics,
} from "@packages/database/schema";
import { and, desc, eq, gte, lte, sql, sum } from "drizzle-orm";
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
      const { db, organizationId } = context;

      const rows = await db
         .select()
         .from(dailyContentAnalytics)
         .where(
            and(
               eq(dailyContentAnalytics.organizationId, organizationId),
               ...(input.contentId
                  ? [eq(dailyContentAnalytics.contentId, input.contentId)]
                  : []),
               gte(
                  dailyContentAnalytics.date,
                  input.startDate.toISOString().split("T")[0],
               ),
               lte(
                  dailyContentAnalytics.date,
                  input.endDate.toISOString().split("T")[0],
               ),
            ),
         )
         .orderBy(dailyContentAnalytics.date);

      return rows;
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
      const { db, organizationId } = context;
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

      const rows = await db
         .select()
         .from(dailyContentAnalytics)
         .where(
            and(
               eq(dailyContentAnalytics.organizationId, organizationId),
               ...(input.contentId
                  ? [eq(dailyContentAnalytics.contentId, input.contentId)]
                  : []),
               gte(
                  dailyContentAnalytics.date,
                  startDate.toISOString().split("T")[0],
               ),
               lte(
                  dailyContentAnalytics.date,
                  endDate.toISOString().split("T")[0],
               ),
            ),
         )
         .orderBy(dailyContentAnalytics.date);

      return rows;
   });

/**
 * Get top performing content
 */
export const getTopContent = protectedProcedure
   .input(
      z.object({
         sortBy: z
            .enum(["views", "engagement", "conversions"])
            .default("views"),
         limit: z.number().min(1).max(50).default(10),
         startDate: z.coerce.date(),
         endDate: z.coerce.date(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const rows = await db
         .select({
            contentId: dailyContentAnalytics.contentId,
            totalViews: sum(dailyContentAnalytics.views).as("total_views"),
            totalUniqueVisitors: sum(dailyContentAnalytics.uniqueVisitors).as(
               "total_unique_visitors",
            ),
            totalCtaClicks: sum(dailyContentAnalytics.ctaClicks).as(
               "total_cta_clicks",
            ),
         })
         .from(dailyContentAnalytics)
         .where(
            and(
               eq(dailyContentAnalytics.organizationId, organizationId),
               gte(
                  dailyContentAnalytics.date,
                  input.startDate.toISOString().split("T")[0],
               ),
               lte(
                  dailyContentAnalytics.date,
                  input.endDate.toISOString().split("T")[0],
               ),
            ),
         )
         .groupBy(dailyContentAnalytics.contentId)
         .orderBy(desc(sql`total_views`))
         .limit(input.limit);

      return rows;
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
      const { db, organizationId } = context;

      const rows = await db
         .select()
         .from(contentTrafficSources)
         .where(
            and(
               eq(contentTrafficSources.organizationId, organizationId),
               ...(input.contentId
                  ? [eq(contentTrafficSources.contentId, input.contentId)]
                  : []),
            ),
         )
         .orderBy(desc(contentTrafficSources.views));

      return rows;
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
      const { db, organizationId } = context;

      const config = {
         type: "funnels" as const,
         steps: [
            { event: "content.page.view", label: "Page View", filters: [] },
            {
               event: "content.scroll.milestone",
               label: "Scroll Complete",
               filters: [],
            },
            { event: "content.cta.click", label: "CTA Click", filters: [] },
         ],
         conversionWindow: { value: 1, unit: "day" as const },
         dateRange: {
            type: "absolute" as const,
            start: input.startDate.toISOString(),
            end: input.endDate.toISOString(),
         },
         exclusions: [],
         compare: false,
      };

      return executeFunnelsQuery(db, organizationId, config);
   });
