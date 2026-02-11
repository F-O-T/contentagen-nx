import { executeFunnelsQuery } from "@packages/analytics/funnels";
import { executeRetentionQuery } from "@packages/analytics/retention";
import { executeTrendsQuery } from "@packages/analytics/trends";
import { insightConfigSchema } from "@packages/analytics/types";
import { getDefaultDashboard as fetchDefaultDashboard } from "@packages/database/repositories/dashboard-repository";
import { AppError, propagateError } from "@packages/utils/errors";
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
         propagateError(error);
         throw AppError.internal("Failed to execute analytics query", {
            cause: error,
         });
      }
   });

/**
 * Get the organization's default dashboard
 */
export const getDefaultDashboard = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId } = context;

      try {
         return await fetchDefaultDashboard(db, organizationId);
      } catch (error) {
         propagateError(error);
         throw AppError.internal("Failed to fetch default dashboard", {
            cause: error,
         });
      }
   },
);
