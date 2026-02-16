import type { DatabaseInstance } from "@packages/database/client";
import type { Insight } from "@packages/database/schemas/insights";
import { AppError, propagateError } from "@packages/utils/errors";
import { executeFunnelsQuery } from "./funnels";
import { executeRetentionQuery } from "./retention";
import { executeTrendsQuery } from "./trends";
import {
   funnelsConfigSchema,
   insightConfigSchema,
   retentionConfigSchema,
   trendsConfigSchema,
} from "./types";

/**
 * Compute insight data based on insight configuration.
 * Returns the query result in JSON format ready to be cached.
 */
export async function computeInsightData(
   db: DatabaseInstance,
   insight: Insight,
): Promise<Record<string, unknown>> {
   try {
      // Parse and validate config
      const config = insightConfigSchema.parse(insight.config);

      // Dispatch to appropriate query executor based on type
      switch (config.type) {
         case "trends": {
            const trendsConfig = trendsConfigSchema.parse(config);
            const result = await executeTrendsQuery(
               db,
               insight.organizationId,
               trendsConfig,
            );
            return result as unknown as Record<string, unknown>;
         }
         case "funnels": {
            const funnelsConfig = funnelsConfigSchema.parse(config);
            const result = await executeFunnelsQuery(
               db,
               insight.organizationId,
               funnelsConfig,
            );
            return result as unknown as Record<string, unknown>;
         }
         case "retention": {
            const retentionConfig = retentionConfigSchema.parse(config);
            const result = await executeRetentionQuery(
               db,
               insight.organizationId,
               retentionConfig,
            );
            return result as unknown as Record<string, unknown>;
         }
         default: {
            throw AppError.validation(
               `Unknown insight type: ${(config as { type: string }).type}`,
            );
         }
      }
   } catch (err) {
      propagateError(err);
      throw AppError.internal(`Failed to compute insight data: ${err}`, {
         cause: err,
      });
   }
}
