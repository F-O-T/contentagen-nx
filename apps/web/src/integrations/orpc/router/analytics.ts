import { executeFunnelsQuery } from "@packages/analytics/funnels";
import { executeRetentionQuery } from "@packages/analytics/retention";
import { executeTrendsQuery } from "@packages/analytics/trends";
import { insightConfigSchema } from "@packages/analytics/types";
import { getDefaultDashboard as fetchDefaultDashboard } from "@packages/database/repositories/dashboard-repository";
import { ORPCError } from "@orpc/server";
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
 * Get the organization's default dashboard (creates one if it doesn't exist)
 */
export const getDefaultDashboard = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId, teamId, userId } = context;

      try {
         return await fetchDefaultDashboard(db, organizationId, teamId, userId);
      } catch (error) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to fetch default dashboard",
            cause: error,
         });
      }
   },
);
