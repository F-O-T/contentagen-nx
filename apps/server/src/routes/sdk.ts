import { Elysia, t } from "elysia";
import { mastra, setRuntimeContext } from "@packages/agents";
import { AppError, propagateError } from "@packages/utils/errors";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import {
   getContentById,
   getContentBySlug,
   listContents,
} from "@packages/database/repositories/content-repository";
import { streamFileForProxy } from "@packages/files/client";
import { searchRelatedSlugsByText } from "@packages/rag/repositories/related-slugs-repository";
import { auth } from "@api/integrations/auth";
import { db, ragClient } from "@api/integrations/database";
import { serverEnv as env } from "@packages/environment/server";
import { minioClient } from "@api/integrations/minio";
import { listBrands } from "@packages/database/repositories/brand-repository";
import type { SupportedLng } from "@packages/localization";
const minioBucket = env.MINIO_BUCKET;

const ImageSchema = t.Object(
   {
      data: t.String(),
      contentType: t.String(),
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

            const apiKeyData = await auth.api.verifyApiKey({
               headers: request.headers,
               body: { key: authHeader },
            });

            if (!apiKeyData.valid) {
               throw new Error("Invalid API Key.");
            }

            const session = await auth.api.getSession({
               headers: new Headers({ "sdk-api-key": authHeader }),
            });

            return { session };
         },
      },
   })
   .get(
      "/author/:agentId",
      async ({ params }) => {
         const agent = await getAgentById(db, params.agentId);
         if (!agent) {
            throw new Error("Agent not found");
         }

         let profilePhoto = null;
         if (agent.profilePhotoUrl) {
            try {
               const { buffer, contentType } = await streamFileForProxy(
                  agent.profilePhotoUrl,
                  minioBucket,
                  minioClient,
               );
               profilePhoto = {
                  data: buffer.toString("base64"),
                  contentType,
               };
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
         sdkAuth: true,
         params: t.Object({
            agentId: t.String(),
         }),
         response: t.Object({
            name: t.String(),
            profilePhoto: t.Nullable(ImageSchema),
         }),
      },
   )
   .get(
      "/related-slugs",
      async ({ query }) => {
         if (!query.slug || !query.agentId) {
            throw new Error("Slug and Agent ID are required.");
         }

         const slugs = await searchRelatedSlugsByText(
            ragClient,
            query.slug,
            query.agentId,
            { limit: 5 },
         );

         return slugs.map((s) => s.slug).filter((s) => s !== query.slug);
      },
      {
         query: t.Object({
            slug: t.String(),
            agentId: t.String(),
         }),
         response: t.Array(t.String()),
      },
   )

   .get(
      "/assistant",
      async function* ({ query, request }) {
         const language = request.headers.get("x-locale");
         if (!language) {
            throw new Error("Language header is required.");
         }
         if (!query.agentId) {
            throw new Error("Agent ID is required.");
         }

         const agent = await getAgentById(db, query.agentId);
         if (!agent) {
            throw new Error("Agent not found.");
         }
         const brand = await listBrands(db, {
            organizationId: agent.organizationId ?? "",
         }).then((brands) => brands[0]);
         const runtimeContext = setRuntimeContext({
            userId: agent.userId,
            language: language as SupportedLng,
            brandId: brand?.id || "",
         });

         try {
            const agentInstance = mastra.getAgent("appAssistantAgent");
            const result = await agentInstance.stream(
               [{ role: "user", content: query.message }],
               { runtimeContext, format: "aisdk" },
            );
            return result.toTextStreamResponse();
         } catch (error) {
            console.error("Error processing agent generation:", error);
            propagateError(error);
            throw AppError.internal("Internal Server Error");
         }
      },
      {
         sdkAuth: true,

         query: t.Object({
            message: t.String(),
            agentId: t.String(),
         }),
      },
   )

   // listContentByAgent
   .get(
      "/content/:agentId",
      async ({ params, query }) => {
         const { agentIds } = params;
         const limit = parseInt(query.limit || "10", 10);
         const page = parseInt(query.page || "1", 10);
         const status = query.status;

         const all = await listContents(db, agentIds, status);
         const start = (page - 1) * limit;
         const end = start + limit;
         const posts = all.slice(start, end);

         const postsWithImages = await Promise.all(
            posts.map(async (post) => {
               let image = null;
               if (post.imageUrl) {
                  try {
                     const { buffer, contentType } = await streamFileForProxy(
                        post.imageUrl,
                        minioBucket,
                        minioClient,
                     );
                     image = {
                        data: buffer.toString("base64"),
                        contentType,
                     };
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
         sdkAuth: true,

         params: t.Object({
            agentIds: t.Array(t.String()),
         }),
         query: t.Object({
            limit: t.Optional(t.String()),
            page: t.Optional(t.String()),
            status: t.Array(t.UnionEnum(["draft", "approved"])),
         }),
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
                  const { buffer, contentType } = await streamFileForProxy(
                     content.imageUrl,
                     minioBucket,
                     minioClient,
                  );
                  image = {
                     data: buffer.toString("base64"),
                     contentType,
                  };
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
         sdkAuth: true,

         params: t.Object({
            agentId: t.String(),
            slug: t.String(),
         }),
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

            const { buffer, contentType } = await streamFileForProxy(
               content.imageUrl,
               minioBucket,
               minioClient,
            );

            return {
               data: buffer.toString("base64"),
               contentType,
            };
         } catch (error) {
            console.error("Error fetching content image:", error);
            return null;
         }
      },
      {
         sdkAuth: true,

         params: t.Object({
            contentId: t.String(),
         }),
         response: t.Nullable(ImageSchema),
      },
   );
