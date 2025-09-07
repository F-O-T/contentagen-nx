import {
   updateContent,
   updateContentCurrentVersion,
   getContentById,
} from "@packages/database/repositories/content-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import type { ContentMeta, ContentStats } from "@packages/database/schema";
import { emitContentStatusChanged } from "@packages/server-events";
import {
   createContentVersion,
   getNextVersionNumber,
} from "@packages/database/repositories/content-version-repository";
import { createDiff, createLineDiff } from "@packages/helpers/text";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

export async function runSaveContent(payload: {
   contentId: string;
   content: string;
   stats: ContentStats;
   meta: ContentMeta;
   userId?: string;
   baseVersion?: number; // Optional version to compare against
}) {
   const {
      contentId,
      content,
      meta,
      stats,
      userId,
      baseVersion: _baseVersion,
   } = payload;
   let baseContentForDiff: Awaited<ReturnType<typeof getContentById>> | null =
      null;
   if (userId) {
      try {
         baseContentForDiff = await getContentById(db, contentId);
      } catch (e) {
         baseContentForDiff = null;
      }
   }
   try {
      await updateContent(db, contentId, {
         body: content,
         stats,
         meta,
         status: "draft",
      });
   } catch (error) {
      console.error("Error saving content to database:", error);
      throw error;
   }

   if (!userId) {
      emitContentStatusChanged({
         contentId,
         status: "draft",
      });
      return { contentId, content };
   }

   try {
      let diff = null;
      let lineDiff = null;
      const changedFields: string[] = [];

      try {
         let baseVersionBody = "";
         let baseContentMeta: ContentMeta = {};

         const currentContent = baseContentForDiff;
         baseContentMeta = currentContent?.meta || {};
         baseVersionBody = currentContent?.body ?? "";

         diff = createDiff(baseVersionBody, content);
         lineDiff = createLineDiff(baseVersionBody, content);

         if (meta.title !== baseContentMeta.title) {
            changedFields.push("title");
         }
         if (meta.description !== baseContentMeta.description) {
            changedFields.push("description");
         }
         if (
            JSON.stringify(meta.keywords) !==
            JSON.stringify(baseContentMeta.keywords)
         ) {
            changedFields.push("keywords");
         }
         if (meta.slug !== baseContentMeta.slug) {
            changedFields.push("slug");
         }
         if (
            JSON.stringify(meta.sources) !==
            JSON.stringify(baseContentMeta.sources)
         ) {
            changedFields.push("sources");
         }
         if (content !== baseVersionBody) {
            changedFields.push("body");
         }
      } catch (err) {
         console.log("No base version found for diff calculation");
      }

      const versionNumber = await getNextVersionNumber(db, contentId);

      await createContentVersion(db, {
         contentId,
         userId,
         version: versionNumber,
         meta: {
            diff,
            lineDiff,
            changedFields,
         },
      });

      await updateContentCurrentVersion(db, contentId, versionNumber);
   } catch (versionError) {
      console.error("Error creating content version:", versionError);
   }

   emitContentStatusChanged({
      contentId,
      status: "draft",
   });

   return { contentId, content };
}
