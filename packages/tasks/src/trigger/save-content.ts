import { task, logger } from "@trigger.dev/sdk/v3";
import { updateContent } from "@packages/database/repositories/content-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import type { ContentMeta, ContentStats } from "@packages/database/schema";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

async function runSaveContent(payload: {
   contentId: string;
   content: string;
   stats: ContentStats;
   meta: ContentMeta;
}) {
   const { contentId, content, meta, stats } = payload;
   try {
      logger.info("Saving generated content", { contentId });
      await updateContent(db, contentId, {
         body: content,
         stats,
         meta,
         status: "draft",
      });
      logger.info("Content saved", { contentId });
      return { contentId, content };
   } catch (error) {
      logger.error("Error in save content task", {
         error: error instanceof Error ? error.message : error,
      });
      throw error;
   }
}

export const saveContentTask = task({
   id: "save-content-job",
   run: runSaveContent,
});
