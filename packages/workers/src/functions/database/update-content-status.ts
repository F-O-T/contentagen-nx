import { updateContent } from "@packages/database/repositories/content-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import type { ContentStatus } from "@packages/database/schema";
import { emitContentStatusChanged } from "@packages/server-events";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

export async function updateContentStatus(payload: {
   contentId: string;
   status: ContentStatus;
}) {
   const { contentId, status } = payload;
   try {
      // Update database first
      await updateContent(db, contentId, {
         status,
      });

      // Then emit event
      emitContentStatusChanged({
         contentId,
         status,
      });

      return { contentId, status };
   } catch (error) {
      console.error(`Error updating content status to ${status}:`, error);
      throw error;
   }
}
