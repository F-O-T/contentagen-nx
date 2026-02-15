import { BlogAnalyticsTracker } from "@f-o-t/contentta-sdk/analytics";
import {
   getContentById,
   getContentBySlug,
   listContents,
} from "@packages/database/repositories/content-repository";
import { env } from "@packages/environment/server";
import { generatePresignedGetUrl } from "@packages/files/client";
import {
   captureSDKAuthFailed,
   captureSDKContentFetched,
   captureSDKContentListed,
   captureSDKError,
   captureSDKImageFetched,
} from "@packages/posthog/sdk/server";
import { PlanName } from "@packages/stripe/constants";
import { Elysia, t } from "elysia";
import { auth } from "../integrations/auth";
import { db } from "../integrations/database";
import { minioClient } from "../integrations/minio";
import { posthog } from "../integrations/posthog";
import { checkDomainAllowed } from "../utils/sdk-auth";

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

const ImageSchema = t.Object(
   {
      contentType: t.String(),
      data: t.String(),
   },
   { additionalProperties: true },
);

export const sdkRoutes = new Elysia({
   prefix: "/sdk",
   serve: {
      idleTimeout: 0,
   },
})
   .macro({
      sdkAuth: {
         async resolve({ request }) {
            const endpoint = new URL(request.url).pathname;
            const apiKeyHeader = request.headers.get("sdk-api-key");

            if (!apiKeyHeader) {
               captureSDKAuthFailed(posthog, {
                  reason: "missing_api_key",
                  endpoint,
               });
               throw new Error("Missing API Key.");
            }

            // Better Auth verifyApiKey handles:
            // - Key validation
            // - Rate limiting (returns RATE_LIMITED error if exceeded)
            // - Remaining count decrement
            const result = await auth.api.verifyApiKey({
               body: { key: apiKeyHeader },
            });

            if (!result.valid || !result.key) {
               const isRateLimited = result.error?.code === "RATE_LIMITED";
               const reason = isRateLimited ? "rate_limited" : "invalid_key";

               captureSDKAuthFailed(posthog, {
                  reason,
                  endpoint,
                  organizationId: result.key?.metadata?.organizationId as
                     | string
                     | undefined,
                  plan: result.key?.metadata?.plan as string | undefined,
                  remaining: result.key?.remaining ?? undefined,
               });

               if (isRateLimited) {
                  throw new Error(
                     "Rate limit exceeded. Please try again later.",
                  );
               }
               throw new Error("Invalid API Key.");
            }

            const { plan, organizationId, sdkMode, teamId } =
               result.key.metadata ?? {};

            const resolvedTeamId =
               typeof teamId === "string" ? teamId : undefined;

            const domainCheck = await checkDomainAllowed(
               request,
               resolvedTeamId,
               db,
            );
            if (!domainCheck.allowed) {
               throw new Error("Origin not allowed");
            }

            return {
               apiKey: result.key,
               plan: (plan as PlanName) ?? PlanName.FREE,
               organizationId: organizationId as string | undefined,
               teamId: resolvedTeamId,
               sdkMode: (sdkMode as "static" | "ssr") ?? "static",
               remaining: result.key.remaining,
               userId: result.key.userId,
            };
         },
      },
   })
   // Removed /related-slugs endpoint - use new RAG system in @packages/agents/mastra/rag

   // listContentByAgent
   .get(
      "/content/:agentId",
      async ({
         params,
         query,
         organizationId,
         plan,
         sdkMode,
         remaining,
         set,
      }) => {
         const { agentId } = params;
         const limit = parseInt(query.limit || "10", 10);
         const page = parseInt(query.page || "1", 10);
         const status = query.status;
         const all = await listContents(db, [agentId], status ?? ["published"]);
         const start = (page - 1) * limit;
         const end = start + limit;
         const posts = all.slice(start, end);

         const postsWithImages = await Promise.all(
            posts.map(async (post) => {
               let image = null;
               if (post.imageUrl) {
                  try {
                     const url = await resolveStorageKeyToUrl(post.imageUrl);
                     image = url
                        ? { contentType: "image/jpeg", data: url }
                        : null;
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

         // Add SDK info headers
         set.headers["X-SDK-Mode"] = sdkMode;
         set.headers["X-SDK-Plan"] = plan;
         if (remaining !== null && remaining !== undefined) {
            set.headers["X-SDK-Remaining"] = remaining.toString();
         }

         return { posts: postsWithImages, total: all.length };
      },
      {
         params: t.Object({
            agentId: t.String(),
         }),
         query: t.Object({
            limit: t.Optional(t.String()),
            page: t.Optional(t.String()),
            status: t.Optional(
               t.Array(t.UnionEnum(["draft", "published", "archived"])),
            ),
         }),
         sdkAuth: true,
      },
   )

   // getContentBySlug
   .get(
      "/content/:agentId/:slug",
      async ({ params, organizationId, plan, sdkMode, remaining, set }) => {
         try {
            const content = await getContentBySlug(
               db,
               params.slug,
               params.agentId,
            );
            if (!content) {
               throw new Error("Content not found");
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
            let analytics;
            const posthogPublicKey = env.POSTHOG_PUBLIC_KEY;
            if (posthogPublicKey && organizationId) {
               const tracker = new BlogAnalyticsTracker();
               const wordCount = parseInt(content.stats?.wordsCount || "0", 10);
               const estimatedReadTime =
                  parseInt(content.stats?.readTimeMinutes || "0", 10) * 60;

               const trackingScript = tracker.generateTrackingScript({
                  contentId: content.id,
                  contentSlug: params.slug,
                  contentTitle: content.meta?.title ?? "",
                  agentId: params.agentId,
                  organizationId,
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

            // Add SDK info headers
            set.headers["X-SDK-Mode"] = sdkMode;
            set.headers["X-SDK-Plan"] = plan;
            if (remaining !== null && remaining !== undefined) {
               set.headers["X-SDK-Remaining"] = remaining.toString();
            }

            return {
               ...content,
               image,
               analytics,
            };
         } catch (err) {
            throw new Error(
               err instanceof Error ? err.message : "An unknown error occurred",
            );
         }
      },
      {
         params: t.Object({
            agentId: t.String(),
            slug: t.String(),
         }),
         sdkAuth: true,
      },
   )

   // getContentImage
   .get(
      "/content/image/:contentId",
      async ({ params, plan, sdkMode, remaining, set }) => {
         try {
            const content = await getContentById(db, params.contentId);

            if (!content?.imageUrl) {
               return null;
            }

            // Add SDK info headers
            set.headers["X-SDK-Mode"] = sdkMode;
            set.headers["X-SDK-Plan"] = plan;
            if (remaining !== null && remaining !== undefined) {
               set.headers["X-SDK-Remaining"] = remaining.toString();
            }

            const url = await resolveStorageKeyToUrl(content.imageUrl);
            return url ? { contentType: "image/jpeg", data: url } : null;
         } catch (error) {
            console.error("Error fetching content image:", error);
            return null;
         }
      },
      {
         params: t.Object({
            contentId: t.String(),
         }),
         response: t.Nullable(ImageSchema),
         sdkAuth: true,
      },
   );
