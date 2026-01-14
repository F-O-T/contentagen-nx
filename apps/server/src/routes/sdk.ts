import { getWriterById } from "@packages/database/repositories/writer-repository";
import {
   getContentById,
   getContentBySlug,
   listContents,
} from "@packages/database/repositories/content-repository";
import { serverEnv as env } from "@packages/environment/server";
import { generatePresignedGetUrl } from "@packages/files/client";
import { Elysia, t } from "elysia";
import { auth } from "../integrations/auth";
import { db } from "../integrations/database";
import { minioClient } from "../integrations/minio";
import { Feature, requireFeatureAccess } from "../utils/feature-gate";

const minioBucket = env.MINIO_BUCKET;

// Helper to resolve storage key to presigned URL
async function resolveStorageKeyToUrl(
   storageKey: string | null | undefined,
): Promise<string | null> {
   if (!storageKey) return null;
   try {
      return await generatePresignedGetUrl(storageKey, minioBucket, minioClient);
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
            const authHeader = request.headers.get("sdk-api-key");
            if (!authHeader) {
               throw new Error("Missing API Key.");
            }

            // TODO: Implement API key verification when better-auth apiKey plugin is configured
            const session = await auth.api.getSession({
               headers: request.headers,
            });

            if (!session) {
               throw new Error("Invalid session.");
            }

            // Check if the organization has API_ACCESS feature
            const organizationId = session.session?.activeOrganizationId;
            await requireFeatureAccess(
               Feature.API_ACCESS,
               organizationId,
               request.headers,
            );

            return { session };
         },
      },
   })
   .get(
      "/author/:agentId",
      async ({ params, session }) => {
         const agent = await getWriterById(db, params.agentId);

         if (!agent) {
            throw new Error("Agent not found");
         }

         // Check if user belongs to the organization that owns this agent
         const activeOrgId = session?.session?.activeOrganizationId;
         if (!activeOrgId || agent.organizationId !== activeOrgId) {
            throw new Error("Unauthorized access to agent information.");
         }

         let profilePhoto = null;
         if (agent.profilePhotoUrl) {
            try {
               const url = await resolveStorageKeyToUrl(agent.profilePhotoUrl);
               profilePhoto = url ? { contentType: "image/jpeg", data: url } : null;
            } catch (err) {
               console.error("Error fetching profile photo:", err);
               profilePhoto = null;
            }
         }

         return {
            name: agent.personaConfig?.metadata?.name ?? "",
            profilePhoto,
         };
      },
      {
         params: t.Object({
            agentId: t.String(),
         }),
         response: t.Object({
            name: t.String(),
            profilePhoto: t.Nullable(ImageSchema),
         }),
         sdkAuth: true,
      },
   )
   // Removed /related-slugs endpoint - use new RAG system in @packages/agents/mastra/rag

   // listContentByAgent
   .get(
      "/content/:agentId",
      async ({ params, query }) => {
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
      async ({ params }) => {
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

            return {
               ...content,
               image,
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
      async ({ params }) => {
         try {
            const content = await getContentById(db, params.contentId);

            if (!content?.imageUrl) {
               return null;
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
