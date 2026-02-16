import { BlogAnalyticsTracker } from "@contentta/sdk/analytics";
import { ORPCError } from "@orpc/server";
import {
   getContentById,
   getContentBySlug,
   listContents,
} from "@packages/database/repositories/content-repository";
import { env } from "@packages/environment/server";
import { generatePresignedGetUrl } from "@packages/files/client";
import { z } from "zod";
import { minioClient } from "../../integrations/minio";
import { sdkProcedure } from "../server";

const minioBucket = env.MINIO_BUCKET;

// Helper to resolve storage key to presigned URL
async function resolveStorageKeyToUrl(
   storageKey: string | null | undefined,
): Promise<string | null> {
   if (!storageKey) return null;
   try {
      return await generatePresignedGetUrl(
         storageKey,
         minioBucket,
         minioClient,
      );
   } catch (error) {
      console.error("Error generating presigned URL:", error);
      return null;
   }
}

// =============================================================================
// Content Procedures
// =============================================================================

/**
 * List content by agent
 */
export const list = sdkProcedure
   .input(
      z.object({
         agentId: z.string().uuid(),
         limit: z.string().optional().default("10"),
         page: z.string().optional().default("1"),
         status: z.array(z.enum(["draft", "published", "archived"])).optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const limit = Number.parseInt(input.limit, 10);
      const page = Number.parseInt(input.page, 10);
      const status = input.status ?? ["published"];

      const all = await listContents(context.db, [input.agentId], status);
      const start = (page - 1) * limit;
      const end = start + limit;
      const posts = all.slice(start, end);

      const postsWithImages = await Promise.all(
         posts.map(async (post) => {
            let image = null;
            if (post.imageUrl) {
               try {
                  const url = await resolveStorageKeyToUrl(post.imageUrl);
                  image = url ? { contentType: "image/jpeg", data: url } : null;
               } catch (error) {
                  console.error(
                     "Error fetching image for post:",
                     post.id,
                     error,
                  );
                  image = null;
               }
            }
            return {
               ...post,
               image,
            };
         }),
      );

      return { posts: postsWithImages, total: all.length };
   });

/**
 * Get content by slug
 */
export const get = sdkProcedure
   .input(
      z.object({
         agentId: z.string().uuid(),
         slug: z.string(),
      }),
   )
   .handler(async ({ context, input }) => {
      const content = await getContentBySlug(
         context.db,
         input.slug,
         context.organizationId,
         input.agentId,
      );

      if (!content) {
         throw new ORPCError("NOT_FOUND", { message: "Content not found" });
      }

      let image = null;
      if (content.imageUrl) {
         try {
            const url = await resolveStorageKeyToUrl(content.imageUrl);
            image = url ? { contentType: "image/jpeg", data: url } : null;
         } catch (error) {
            console.error(
               "Error fetching image for content:",
               content.id,
               error,
            );
            image = null;
         }
      }

      // Generate analytics tracking script if PostHog public key is available
      let analytics: { trackingScript: string; enabled: boolean } | undefined;
      const posthogPublicKey = env.POSTHOG_PUBLIC_KEY;
      if (posthogPublicKey && context.organizationId) {
         const tracker = new BlogAnalyticsTracker();
         const wordCount = Number.parseInt(
            content.stats?.wordsCount || "0",
            10,
         );
         const estimatedReadTime =
            Number.parseInt(content.stats?.readTimeMinutes || "0", 10) * 60;

         const trackingScript = tracker.generateTrackingScript({
            contentId: content.id,
            contentSlug: input.slug,
            contentTitle: content.meta?.title ?? "",
            agentId: input.agentId,
            organizationId: context.organizationId,
            wordCount,
            estimatedReadTime,
            posthogHost: env.POSTHOG_HOST,
            posthogApiKey: posthogPublicKey,
         });

         analytics = {
            trackingScript,
            enabled: true,
         };
      }

      return {
         ...content,
         image,
         analytics,
      };
   });

/**
 * Get content image by contentId
 */
export const getImage = sdkProcedure
   .input(
      z.object({
         contentId: z.string().uuid(),
      }),
   )
   .handler(async ({ context, input }) => {
      const content = await getContentById(context.db, input.contentId);

      if (!content?.imageUrl) {
         return null;
      }

      const url = await resolveStorageKeyToUrl(content.imageUrl);
      return url ? { contentType: "image/jpeg", data: url } : null;
   });
