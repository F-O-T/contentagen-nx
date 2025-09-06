import {
   updateContent,
   updateContentCurrentVersion,
} from "@packages/database/repositories/content-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import type { ContentMeta, ContentStats } from "@packages/database/schema";
import { emitContentStatusChanged } from "@packages/server-events";
import {
   createContentVersion,
   getLatestVersionByContentId,
   getNextVersionNumber,
   getVersionByNumber,
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
   const { contentId, content, meta, stats, userId, baseVersion } = payload;
   try {
      await updateContent(db, contentId, {
         body: content,
         stats,
         meta,
         status: "draft",
      });

      // Create new version if userId is provided
      if (userId) {
         try {
            // Calculate diff from specified base version or latest version
            let diff = null;
            let lineDiff = null;
            const changedFields: string[] = [];
            try {
               let baseVersionBody = "";
               let baseVersionMeta: ContentMeta = {};

               if (baseVersion) {
                  // Get the specific version to compare against
                  const baseVersionData = await getVersionByNumber(
                     db,
                     contentId,
                     baseVersion,
                  );
                  baseVersionBody = baseVersionData.body;
                  baseVersionMeta = baseVersionData.meta;
               } else {
                  // Use latest version (current behavior)
                  const previousVersion = await getLatestVersionByContentId(
                     db,
                     contentId,
                  );
                  baseVersionBody = previousVersion.body;
                  baseVersionMeta = previousVersion.meta;
               }

               diff = createDiff(baseVersionBody, content);
               lineDiff = createLineDiff(baseVersionBody, content);

               // Track which fields changed
               if (meta.title !== baseVersionMeta.title) {
                  changedFields.push("title");
               }
               if (meta.description !== baseVersionMeta.description) {
                  changedFields.push("description");
               }
               if (
                  JSON.stringify(meta.keywords) !==
                  JSON.stringify(baseVersionMeta.keywords)
               ) {
                  changedFields.push("keywords");
               }
               if (meta.slug !== baseVersionMeta.slug) {
                  changedFields.push("slug");
               }
               if (
                  JSON.stringify(meta.sources) !==
                  JSON.stringify(baseVersionMeta.sources)
               ) {
                  changedFields.push("sources");
               }
               if (content !== baseVersionBody) {
                  changedFields.push("body");
               }
            } catch (err) {
               // If no base version exists, diff will be null
               console.log("No base version found for diff calculation");
            }

            // Get next version number
            const versionNumber = await getNextVersionNumber(db, contentId);

            // Create new version
            await createContentVersion(db, {
               contentId,
               userId,
               version: versionNumber,
               body: content,
               meta: meta || {},
               diff,
               lineDiff,
               changedFields,
            });

            // Update the content's current version
            await updateContentCurrentVersion(db, contentId, versionNumber);
         } catch (versionError) {
            console.error("Error creating content version:", versionError);
            // Don't fail the entire operation if versioning fails
         }
      }

      // Emit final draft status
      emitContentStatusChanged({
         contentId,
         status: "draft",
      });

      return { contentId, content };
   } catch (error) {
      console.error("Error saving content to database:", error);
      throw error;
   }
}
