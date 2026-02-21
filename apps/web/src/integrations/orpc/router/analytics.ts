import { ORPCError } from "@orpc/server";
import { executeFunnelsQuery } from "@packages/analytics/funnels";
import { executeRetentionQuery } from "@packages/analytics/retention";
import { executeTrendsQuery } from "@packages/analytics/trends";
import { insightConfigSchema } from "@packages/analytics/types";
import { getDefaultDashboard as fetchDefaultDashboard } from "@packages/database/repositories/dashboard-repository";
import { getInsightsByIds } from "@packages/database/repositories/insight-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Analytics Procedures
// =============================================================================

/**
 * Universal insight query endpoint — dispatches to the correct query engine
 * based on the insight config type (trends, funnels, retention).
 */
export const query = protectedProcedure
   .input(z.object({ config: insightConfigSchema }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      try {
         switch (input.config.type) {
            case "trends":
               return await executeTrendsQuery(
                  db,
                  organizationId,
                  input.config,
               );
            case "funnels":
               return await executeFunnelsQuery(
                  db,
                  organizationId,
                  input.config,
               );
            case "retention":
               return await executeRetentionQuery(
                  db,
                  organizationId,
                  input.config,
               );
         }
      } catch (error) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to execute analytics query",
            cause: error,
         });
      }
   });

/**
 * Get the organization's default dashboard.
 * Dashboard is created during onboarding completion.
 */
export const getDefaultDashboard = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId, teamId } = context;

      console.log("[Analytics] getDefaultDashboard called:", {
         organizationId,
         teamId,
      });

      try {
         const dashboard = await fetchDefaultDashboard(
            db,
            organizationId,
            teamId,
         );
         console.log("[Analytics] Dashboard found:", dashboard.id);
         return dashboard;
      } catch (error) {
         console.error("[Analytics] Dashboard query failed:", {
            organizationId,
            teamId,
            error,
         });
         // Check if it's a not found error
         if (error instanceof Error && error.message.includes("not found")) {
            throw new ORPCError("NOT_FOUND", {
               message:
                  "Dashboard not found. Please complete onboarding first.",
            });
         }
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to fetch default dashboard",
            cause: error,
         });
      }
   },
);

/**
 * Get insights for a dashboard with their lastComputedAt timestamps.
 * Used to display "last refreshed" time in the dashboard UI.
 */
export const getDashboardInsights = protectedProcedure
   .input(z.object({ dashboardId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId, teamId } = context;

      try {
         // Get dashboard to verify ownership and extract insight IDs
         const dashboard = await fetchDefaultDashboard(
            db,
            organizationId,
            teamId,
         );

         if (dashboard.id !== input.dashboardId) {
            throw new ORPCError("NOT_FOUND", {
               message: "Dashboard not found.",
            });
         }

         // Extract unique insight IDs from dashboard tiles
         const insightIds = [
            ...new Set(dashboard.tiles.map((tile) => tile.insightId)),
         ];

         if (insightIds.length === 0) {
            return [];
         }

         // Fetch all insights
         return await getInsightsByIds(db, insightIds);
      } catch (error) {
         if (error instanceof ORPCError) {
            throw error;
         }
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to fetch dashboard insights",
            cause: error,
         });
      }
   });
