import { enqueueContentPlanningJob } from "@packages/workers/queues/content/content-planning-queue";
import {
   hasGenerationCredits,
   protectedProcedure,
   publicProcedure,
   router,
   organizationProcedure,
} from "../trpc";
import {
   eventEmitter,
   EVENTS,
   type ContentStatusChangedPayload,
} from "@packages/server-events";
import { on } from "node:events";
import {
   ContentInsertSchema,
   ContentUpdateSchema,
   ContentSelectSchema,
} from "@packages/database/schema";
import { enqueueIdeasPlanningJob } from "@packages/workers/queues/ideas/ideas-planning-queue";
import {
   addToCollection,
   getCollection,
   queryCollection,
   deleteFromCollection,
} from "@packages/chroma-db/helpers";
import { listAgents } from "@packages/database/repositories/agent-repository";
import {
   createContent,
   getContentById,
   updateContent,
   deleteContent,
   deleteBulkContent,
   approveBulkContent,
   listContents,
   updateContentCurrentVersion,
} from "@packages/database/repositories/content-repository";
import {
   createContentVersion,
   getAllVersionsByContentId,
   getLatestVersionByContentId,
   getNextVersionNumber,
   getVersionByNumber,
} from "@packages/database/repositories/content-version-repository";
import { canModifyContent } from "@packages/database";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { uploadFile, streamFileForProxy } from "@packages/files/client";
import { compressImage } from "@packages/files/image-helper";

const ContentImageUploadInput = z.object({
   id: z.uuid(),
   fileName: z.string(),
   fileBuffer: z.base64(), // base64 encoded
   contentType: z.string(),
});

const ContentImageStreamInput = z.object({
   id: z.uuid(),
});

export const contentRouter = router({
   regenerate: organizationProcedure
      .use(hasGenerationCredits)

      .input(ContentInsertSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         try {
            if (!input.id) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID is required.",
               });
            }
            const db = (await ctx).db;
            const content = await getContentById(db, input.id);
            if (!content) {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Content not found.",
               });
            }
            // Optionally update status to 'generating'
            await updateContent(db, input.id, { status: "pending" });
            await enqueueContentPlanningJob({
               agentId: content.agentId,
               contentId: content.id,
               contentRequest: content.request,
            });
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   listAllContent: protectedProcedure
      .input(
         z.object({
            status: ContentSelectSchema.shape.status.array().min(1),
            limit: z.number().min(1).max(100).optional().default(10),
            page: z.number().min(1).optional().default(1),
            agentIds: z.array(z.string()).optional(),
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;
         const organizationId =
            resolvedCtx.session?.session?.activeOrganizationId;
         if (!userId) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "User must be authenticated to list content.",
            });
         }
         const agents = await listAgents(resolvedCtx.db, {
            userId,
            organizationId: organizationId ?? "",
         });
         const allUserAgentIds = agents.map((agent) => agent.id);
         if (allUserAgentIds.length === 0) return { items: [], total: 0 };

         // If agentIds provided, filter to only those belonging to the user
         const agentIds = input.agentIds
            ? input.agentIds.filter((id) => allUserAgentIds.includes(id))
            : allUserAgentIds;

         if (agentIds.length === 0) return { items: [], total: 0 };

         const filteredStatus = input.status.filter(
            (s): s is NonNullable<typeof s> => s !== null,
         );
         // Get all content for these agents
         const all = await listContents(
            resolvedCtx.db,
            agentIds,
            filteredStatus,
         );
         const start = (input.page - 1) * input.limit;
         const end = start + input.limit;
         const items = all.slice(start, end);
         return { items, total: all.length };
      }),
   onStatusChanged: publicProcedure
      .input(z.object({ contentId: z.string().optional() }).optional())
      .subscription(async function* (opts) {
         for await (const [payload] of on(eventEmitter, EVENTS.contentStatus, {
            signal: opts.signal,
         })) {
            const event = payload as ContentStatusChangedPayload;
            if (
               !opts.input?.contentId ||
               opts.input.contentId === event.contentId
            ) {
               yield event;
            }
         }
      }),
   addImageUrl: organizationProcedure
      .input(ContentUpdateSchema.pick({ id: true, imageUrl: true }))
      .mutation(async ({ ctx, input }) => {
         try {
            if (!input.id || !input.imageUrl) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID and image URL are required.",
               });
            }
            const db = (await ctx).db;
            const updated = await updateContent(db, input.id, {
               imageUrl: input.imageUrl,
            });
            return { success: true, content: updated };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   uploadImage: organizationProcedure
      .input(ContentImageUploadInput)
      .mutation(async ({ ctx, input }) => {
         try {
            const { id, fileName, fileBuffer } = input;

            // Validate base64 format
            if (!fileBuffer || fileBuffer.length === 0) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Invalid or empty file data",
               });
            }

            // Get current content to check for existing image
            const db = (await ctx).db;
            const currentContent = await getContentById(db, id);

            // Delete old image if it exists
            if (currentContent?.imageUrl) {
               try {
                  const bucketName = (await ctx).minioBucket;
                  const minioClient = (await ctx).minioClient;
                  await minioClient.removeObject(
                     bucketName,
                     currentContent.imageUrl,
                  );
               } catch (error) {
                  console.error("Error deleting old content image:", error);
                  // Continue with upload even if deletion fails
               }
            }

            // Sanitize fileName to prevent directory traversal
            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
            const key = `content/${id}/image/${sanitizedFileName}`;

            let buffer: Buffer;
            try {
               buffer = Buffer.from(fileBuffer, "base64");
            } catch (error) {
               console.error("Error decoding base64 file buffer:", error);
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Invalid base64 data",
               });
            }

            // Compress the image
            const compressedBuffer = await compressImage(buffer, {
               format: "webp",
               quality: 80,
            });

            const bucketName = (await ctx).minioBucket;
            const minioClient = (await ctx).minioClient;

            const url = await uploadFile(
               key,
               compressedBuffer,
               "image/webp",
               bucketName,
               minioClient,
            );

            // Update content imageUrl with the file key
            await updateContent(db, id, { imageUrl: key });

            return { url, success: true };
         } catch (err) {
            console.error("Error uploading content image:", err);
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Failed to upload image",
            });
         }
      }),
   getImage: protectedProcedure
      .input(ContentImageStreamInput)
      .query(async ({ ctx, input }) => {
         try {
            const db = (await ctx).db;
            const content = await getContentById(db, input.id);

            if (!content?.imageUrl) {
               return null;
            }

            const bucketName = (await ctx).minioBucket;
            const key = content.imageUrl;

            const { buffer, contentType } = await streamFileForProxy(
               key,
               bucketName,
               (await ctx).minioClient,
            );

            const base64 = buffer.toString("base64");
            return {
               data: `data:${contentType};base64,${base64}`,
               contentType,
            };
         } catch (error) {
            console.error("Error fetching content image:", error);
            return null;
         }
      }),
   editBody: protectedProcedure
      .input(
         ContentUpdateSchema.pick({ id: true, body: true }).extend({
            baseVersion: z.number().optional(), // Optional version to compare against
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const db = (await ctx).db;
            if (!input.id || !input.body) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID and body are required.",
               });
            }

            // Get the current content to calculate diff
            const currentContent = await getContentById(db, input.id);
            if (!currentContent) {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Content not found.",
               });
            }

            // Get the user ID
            const userId = (await ctx).session?.user.id;
            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to edit content.",
               });
            }

            // Calculate diff from specified base version or latest version
            let diff = null;
            try {
               let baseVersionBody = "";

               if (input.baseVersion) {
                  // Get the specific version to compare against
                  const baseVersion = await getVersionByNumber(
                     db,
                     input.id,
                     input.baseVersion,
                  );
                  baseVersionBody = baseVersion.body;
               } else {
                  // Use latest version (current behavior)
                  const previousVersion = await getLatestVersionByContentId(
                     db,
                     input.id,
                  );
                  baseVersionBody = previousVersion.body;
               }

               const { createDiff } = await import("@packages/helpers/text");
               diff = createDiff(baseVersionBody, input.body);
            } catch (err) {
               // If no base version exists, diff will be null
               console.log("No base version found for diff calculation");
            }

            // Get next version number
            const versionNumber = await getNextVersionNumber(db, input.id);

            // Create new version
            await createContentVersion(db, {
               contentId: input.id,
               userId,
               version: versionNumber,
               body: input.body,
               meta: currentContent.meta || {},
               diff,
            });

            // Update the content's current version
            await updateContentCurrentVersion(db, input.id, versionNumber);

            // Update the content
            const updated = await updateContent(db, input.id, {
               body: input.body,
            });

            return { success: true, content: updated, version: versionNumber };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   create: organizationProcedure
      .use(hasGenerationCredits)

      .input(
         ContentInsertSchema.pick({
            agentId: true, // agentId is required for creation
            request: true, // request is required for creation
         }),
      )
      .output(ContentInsertSchema)
      .mutation(async ({ ctx, input }) => {
         try {
            const userId = (await ctx).session?.user.id;
            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to create content.",
               });
            }
            const created = await createContent((await ctx).db, {
               ...input,
               currentVersion: 1, // Set initial version
            });

            // Create initial version
            await createContentVersion((await ctx).db, {
               contentId: created.id,
               userId,
               version: 1,
               body: created.body || "",
               meta: created.meta || {},
               diff: null, // No diff for initial version
            });

            await enqueueContentPlanningJob({
               agentId: input.agentId,
               contentId: created.id,
               contentRequest: {
                  description: input.request.description,
               },
            });
            return created;
         } catch (err) {
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   update: protectedProcedure
      .input(ContentUpdateSchema)
      .mutation(async ({ ctx, input }) => {
         const { id, ...updateFields } = input;
         if (!id) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Content ID is required for update.",
            });
         }
         try {
            await updateContent((await ctx).db, id, updateFields);
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   delete: protectedProcedure
      .input(ContentInsertSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         try {
            if (!id) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID is required.",
               });
            }

            const db = (await ctx).db;
            const content = await getContentById(db, id);

            // Delete related slug from ChromaDB if it exists
            if (content.meta?.slug) {
               const chromaClient = (await ctx).chromaClient;
               const collection = await getCollection(
                  chromaClient,
                  "RelatedSlugs",
               );
               // Delete documents matching the slug and agentId
               await deleteFromCollection(collection, {
                  where: { agentId: content.agentId },
                  whereDocument: { $contains: content.meta.slug },
               });
            }

            await deleteContent(db, id);
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.string()).min(1) }))
      .mutation(async ({ ctx, input }) => {
         try {
            const { ids } = input;
            if (!ids || ids.length === 0) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "At least one content ID is required.",
               });
            }

            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to delete content.",
               });
            }

            // Get all agents belonging to the user to verify ownership
            const agents = await listAgents(resolvedCtx.db, {
               userId,
               organizationId: organizationId ?? "",
            });
            const allUserAgentIds = agents.map((agent) => agent.id);

            if (allUserAgentIds.length === 0) {
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message: "No agents found for this user.",
               });
            }

            // Verify that all content items belong to user's agents
            const contents = await listContents(
               resolvedCtx.db,
               allUserAgentIds,
               [
                  "approved",
                  "draft",
                  "pending",
                  "planning",
                  "researching",
                  "writing",
                  "editing",
                  "analyzing",
                  "grammar_checking",
               ], // Include all possible statuses
            );

            const userContentIds = contents.map((content) => content.id);
            const unauthorizedIds = ids.filter(
               (id) => !userContentIds.includes(id),
            );

            if (unauthorizedIds.length > 0) {
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message: `You don't have permission to delete content items: ${unauthorizedIds.join(", ")}`,
               });
            }

            // Get content items to be deleted for slug cleanup
            const contentsToDelete = contents.filter((content) =>
               ids.includes(content.id),
            );

            // Delete related slugs from ChromaDB
            const slugsToDelete = contentsToDelete
               .map((content) => content.meta?.slug)
               .filter(
                  (slug): slug is string => slug !== null && slug !== undefined,
               );

            if (slugsToDelete.length > 0) {
               const chromaClient = resolvedCtx.chromaClient;
               const collection = await getCollection(
                  chromaClient,
                  "RelatedSlugs",
               );

               // Delete slugs for each agent
               const agentSlugMap = new Map<string, string[]>();
               contentsToDelete.forEach((content) => {
                  if (content.meta?.slug) {
                     const agentId = content.agent.id;
                     if (!agentSlugMap.has(agentId)) {
                        agentSlugMap.set(agentId, []);
                     }
                     agentSlugMap.get(agentId)?.push(content.meta.slug);
                  }
               });

               // Delete slugs for each agent
               agentSlugMap.forEach(async (slugs, agentId) => {
                  for (const slug of slugs) {
                     await deleteFromCollection(collection, {
                        where: { agentId },
                        whereDocument: { $contains: slug },
                     });
                  }
               });
            }

            // Perform bulk delete
            const result = await deleteBulkContent(resolvedCtx.db, ids);
            return {
               success: true,
               deletedCount: result.deletedCount,
            };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   bulkApprove: organizationProcedure
      .use(hasGenerationCredits)
      .input(z.object({ ids: z.array(z.string()).min(1) }))
      .mutation(async ({ ctx, input }) => {
         try {
            const { ids } = input;
            if (!ids || ids.length === 0) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "At least one content ID is required.",
               });
            }

            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to approve content.",
               });
            }

            // Get all agents belonging to the user to verify ownership
            const agents = await listAgents(resolvedCtx.db, {
               userId,
               organizationId: organizationId ?? "",
            });
            const allUserAgentIds = agents.map((agent) => agent.id);

            if (allUserAgentIds.length === 0) {
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message: "No agents found for this user.",
               });
            }

            // Verify that all content items belong to user's agents and are in draft or pending status
            const contents = await listContents(
               resolvedCtx.db,
               allUserAgentIds,
               ["draft"], // Only draft and pending content can be approved
            );

            const userApprovableContentIds = contents.map(
               (content) => content.id,
            );
            const unauthorizedIds = ids.filter(
               (id) => !userApprovableContentIds.includes(id),
            );

            if (unauthorizedIds.length > 0) {
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message: `You don't have permission to approve content items: ${unauthorizedIds.join(", ")}`,
               });
            }

            // Filter to only process draft and pending items
            const approvableContents = contents.filter(
               (content) =>
                  ids.includes(content.id) &&
                  (content.status === "draft" || content.status === "pending"),
            );
            const approvableIds = approvableContents.map(
               (content) => content.id,
            );

            // Perform bulk approve only on draft and pending items
            const result = await approveBulkContent(
               resolvedCtx.db,
               approvableIds,
            );

            // Save related slugs for approved content into ChromaDB
            try {
               const chromaClient = resolvedCtx.chromaClient;
               const collection = await getCollection(
                  chromaClient,
                  "RelatedSlugs",
               );

               // Build a map of agentId -> Set<slug> to dedupe per agent
               const agentSlugMap = new Map<string, Set<string>>();
               for (const c of approvableContents) {
                  const slug = c.meta?.slug;
                  const agentId = c.agent?.id;
                  if (!slug || !agentId) continue;
                  if (!agentSlugMap.has(agentId))
                     agentSlugMap.set(agentId, new Set());
                  agentSlugMap.get(agentId)!.add(slug);
               }

               // Persist slugs per agent
               for (const [agentId, slugSet] of agentSlugMap.entries()) {
                  const slugs = Array.from(slugSet);
                  if (slugs.length === 0) continue;
                  try {
                     await addToCollection(collection, {
                        documents: slugs,
                        ids: slugs.map(() => crypto.randomUUID()),
                        metadatas: slugs.map(() => ({ agentId })),
                     });
                  } catch (err) {
                     console.error(
                        `Failed to save related slugs for agent ${agentId}:`,
                        err,
                     );
                     // continue — do not block approval flow
                  }
               }
            } catch (err) {
               console.error(
                  "Failed to persist related slugs during bulk approve:",
                  err,
               );
            }

            // Emit status change events for each approved content
            for (const content of approvableContents) {
               eventEmitter.emit(EVENTS.contentStatus, {
                  contentId: content.id,
                  status: "approved",
                  agentId: content.agent.id,
               } as ContentStatusChangedPayload);
            }

            // Generate ideas for approved content that has keywords
            let ideasGeneratedCount = 0;
            for (const content of approvableContents) {
               if (content.meta?.keywords && content.meta.keywords.length > 0) {
                  try {
                     await enqueueIdeasPlanningJob({
                        agentId: content.agent.id,
                        keywords: content.meta.keywords,
                     });
                     ideasGeneratedCount++;
                  } catch (error) {
                     console.error(
                        `Failed to enqueue idea generation for content ${content.id}:`,
                        error,
                     );
                     // Continue with other content items even if one fails
                  }
               }
            }

            return {
               success: true,
               approvedCount: result.approvedCount,
               totalSelected: ids.length,
               approvableCount: approvableIds.length,
               ideasGeneratedCount,
            };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   get: protectedProcedure
      .input(ContentInsertSchema.pick({ id: true }))
      .query(async ({ ctx, input }) => {
         try {
            if (!input.id) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID is required.",
               });
            }
            return await getContentById((await ctx).db, input.id);
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   listByAgentId: protectedProcedure
      .input(
         z.object({
            agentId: ContentSelectSchema.shape.agentId,
            status: ContentSelectSchema.shape.status.array().min(1),
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            if (!input.status || input.status.length === 0) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "At least one status is required to list content.",
               });
            }
            const filteredStatus = input.status.filter(
               (s): s is NonNullable<typeof s> => s !== null,
            );
            const contents = await listContents(
               resolvedCtx.db,
               [input.agentId],
               filteredStatus,
            );
            return contents;
         } catch (err) {
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),

   approve: organizationProcedure
      .use(hasGenerationCredits)

      .input(ContentInsertSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         try {
            if (!input.id) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID is required.",
               });
            }
            const db = (await ctx).db;
            const content = await getContentById(db, input.id);
            if (!content) {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Content not found.",
               });
            }
            if (content.status !== "draft") {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Only draft content can be approved.",
               });
            }
            await updateContent(db, input.id, { status: "approved" });
            // Save slug to related_slugs collection with agentId metadata
            if (content.meta?.slug) {
               const chromaClient = (await ctx).chromaClient;
               const collection = await getCollection(
                  chromaClient,
                  "RelatedSlugs",
               );
               await addToCollection(collection, {
                  documents: [content.meta.slug],
                  ids: [crypto.randomUUID()],
                  metadatas: [{ agentId: content.agentId }],
               });
            }
            if (!content.meta?.keywords || content.meta.keywords.length === 0) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message:
                     "Content must have keywords in meta to generate ideas.",
               });
            }
            await enqueueIdeasPlanningJob({
               agentId: content.agentId,
               keywords: content.meta?.keywords,
            });
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   toggleShare: protectedProcedure
      .input(ContentInsertSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         try {
            if (!input.id) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID is required.",
               });
            }

            const resolvedCtx = await ctx;
            const db = resolvedCtx.db;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to toggle share status.",
               });
            }

            // Check if user can modify this content
            const canModify = await canModifyContent(
               db,
               input.id,
               userId,
               organizationId ?? "",
            );

            if (!canModify) {
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message: "You don't have permission to modify this content.",
               });
            }

            // Get content after access check
            const content = await getContentById(db, input.id);
            if (!content) {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Content not found.",
               });
            }

            const newShareStatus =
               content.shareStatus === "shared" ? "private" : "shared";

            const updated = await updateContent(db, input.id, {
               shareStatus: newShareStatus,
            });

            return {
               success: true,
               shareStatus: newShareStatus,
               content: updated,
            };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   getRelatedSlugs: protectedProcedure
      .input(z.object({ slug: z.string(), agentId: z.string() }))
      .query(async ({ ctx, input }) => {
         try {
            if (!input.slug || !input.agentId) {
               new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Slug and Agent ID are required.",
               });
               return [];
            }
            const resolvedCtx = await ctx;
            const collection = await getCollection(
               resolvedCtx.chromaClient,
               "RelatedSlugs",
            );
            // Query for document matching the slug and metadata.agentId
            const results = await queryCollection(collection, {
               queryTexts: [input.slug],
               nResults: 5,
               whereDocument: {
                  $not_contains: input.slug,
               },
               include: ["documents", "metadatas", "distances"],
               where: { agentId: input.agentId },
            });
            const slugs = results.documents
               .flat()
               .filter(
                  (doc): doc is string =>
                     typeof doc === "string" && doc !== null,
               );

            return slugs;
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   getVersions: protectedProcedure
      .input(z.object({ contentId: z.string() }))
      .query(async ({ ctx, input }) => {
         try {
            if (!input.contentId) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID is required.",
               });
            }

            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to view versions.",
               });
            }

            // Check if user can access this content
            const canAccess = await canModifyContent(
               resolvedCtx.db,
               input.contentId,
               userId,
               organizationId ?? "",
            );

            if (!canAccess) {
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message:
                     "You don't have permission to view versions for this content.",
               });
            }

            const versions = await getAllVersionsByContentId(
               resolvedCtx.db,
               input.contentId,
            );
            return versions;
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
});
