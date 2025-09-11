import { bulkCreateFeatures } from "@packages/database/repositories/competitor-feature-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import type { CompetitorFeatureInsert } from "@packages/database/schemas/competitor-feature";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

export async function runSaveCompetitorFeatures(payload: {
   competitorId: string;
   features: Omit<CompetitorFeatureInsert, "id" | "extractedAt">[];
}) {
   const { competitorId, features } = payload;

   try {
      if (!features || features.length === 0) {
         console.log(`No features to save for competitor ${competitorId}`);
         return { competitorId, savedCount: 0 };
      }

      const savedFeatures = await bulkCreateFeatures(db, features);

      console.log(
         `Successfully saved ${savedFeatures.length} features for competitor ${competitorId}`,
      );

      return { competitorId, savedCount: savedFeatures.length };
   } catch (error) {
      console.error(
         `Error saving competitor features for competitor ${competitorId}:`,
         error,
      );
      throw error;
   }
}
