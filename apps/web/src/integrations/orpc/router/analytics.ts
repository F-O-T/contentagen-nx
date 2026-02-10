import { executeFunnelsQuery } from "@packages/analytics/funnels";
import { executeRetentionQuery } from "@packages/analytics/retention";
import { executeTrendsQuery } from "@packages/analytics/trends";
import { insightConfigSchema } from "@packages/analytics/types";
import { getDefaultDashboard as fetchDefaultDashboard } from "@packages/database/repositories/dashboard-repository";
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

      switch (input.config.type) {
         case "trends":
            return executeTrendsQuery(db, organizationId, input.config);
         case "funnels":
            return executeFunnelsQuery(db, organizationId, input.config);
         case "retention":
            return executeRetentionQuery(db, organizationId, input.config);
      }
   });

/**
 * Get the organization's default dashboard
 */
export const getDefaultDashboard = protectedProcedure.handler(
   async ({ context }) => {
      const { db, organizationId } = context;
      return fetchDefaultDashboard(db, organizationId);
   },
);
