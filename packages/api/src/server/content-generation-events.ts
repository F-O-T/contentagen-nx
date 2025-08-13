import { contentEvent } from "@packages/server-events";
import { updateContent } from "@packages/database/repositories/content-repository";
import type { DatabaseInstance } from "@packages/database/client";

export function registerContentGenerationEvents(db: DatabaseInstance) {
   contentEvent.on("content-generation-finished", async (payload) => {
      const { contentId, metadata } = payload;
      try {
         // Mark content as 'approved' and save meta/stats
         await updateContent(db, contentId, {
            status: "draft",
            meta: metadata.meta,
            stats: metadata.stats,
         });
         console.info(
            `[API] Content generation finished for contentId=${contentId}`,
         );
      } catch (err) {
         console.error(
            `[API] Failed to handle content-generation-finished for contentId=${contentId}`,
            err,
         );
      }
   });
}
