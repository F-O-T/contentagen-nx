import { task, logger } from "@trigger.dev/sdk/v3";
import { updateContent } from "@packages/database/repositories/content-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

export async function runSaveContent(payload: {
   contentId: string;
   content: string;
}) {
   const { contentId, content } = payload;
   try {
      logger.info("Saving generated content", { contentId });
      await updateContent(db, contentId, {
         body: content,
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
