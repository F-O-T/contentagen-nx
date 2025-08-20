import { updateContent } from "@packages/database/repositories/content-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import type { ContentMeta, ContentStats } from "@packages/database/schema";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

export async function runSaveContent(payload: {
   contentId: string;
   content: string;
   stats: ContentStats;
   meta: ContentMeta;
}) {
   const { contentId, content, meta, stats } = payload;
   try {
      await updateContent(db, contentId, {
         body: content,
         stats,
         meta,
         status: "draft",
      });
      return { contentId, content };
   } catch (error) {
      console.error("Error saving content to database:", error);
      throw error;
   }
}
