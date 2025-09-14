import { updateCompetitor } from "@packages/database/repositories/competitor-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import type { CompetitorStatus } from "@packages/database/schema";
import { emitCompetitorStatusChanged } from "@packages/server-events";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

export async function updateCompetitorStatus(payload: {
   competitorId: string;
   status: CompetitorStatus;
}) {
   const { competitorId, status } = payload;
   try {
      // Update database first
      await updateCompetitor(db, competitorId, {
         status,
      });

      // Then emit event
      emitCompetitorStatusChanged({
         competitorId,
         status,
      });

      return { competitorId, status };
   } catch (error) {
      console.error(`Error updating competitor status to ${status}:`, error);
      throw error;
   }
}
