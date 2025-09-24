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
import { listAgents } from "@packages/database/repositories/agent-repository";
import {
   createContent,
   getContentById,
   updateContent,
   deleteContent,
   listContents,
   updateContentCurrentVersion,
} from "@packages/database/repositories/content-repository";
import { canModifyContent } from "@packages/database/repositories/access-control-repository";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { uploadFile, streamFileForProxy } from "@packages/files/client";
import { compressImage } from "@packages/files/image-helper";
import { 
   getCollection, 
   addToCollection, 
   deleteFromCollection,
   queryCollection
} from "@packages/rag/operations/collection-operations";
import { contentVersionRouter } from "./content-version";
import { contentBulkOperationsRouter } from "./content-bulk-operations";
import { contentImagesRouter } from "./content-images";


export const contentRouter = router({
   versions: contentVersionRouter,
   bulk: contentBulkOperationsRouter,
   images: contentImagesRouter,
   regenerate: organizationProcedure
      .use(hasGenerationCredits)
      .input(ContentInsertSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         try {
            if (!input.id) {
               throw APIError.validation("Content ID is required.");
            }
            const db = (await ctx).db;
            const content = await getContentById(db, input.id);
            if (!content) {
               throw APIError.notFound("Content not found.");
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
            propagateError(err);
            throw APIError.internal("Failed to create content");
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
            throw APIError.unauthorized(
               "User must be authenticated to list content.",
            );
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
               throw APIError.unauthorized(
                  "User must be authenticated to create content.",
               );
            }
            const db = (await ctx).db;
            const created = await db.transaction(async (tx) => {
               const c = await createContent(tx, {
                  ...input,
                  currentVersion: 1, // Set initial version
               });
               await createContentVersion(tx, {
                  contentId: c.id,
                  userId,
                  version: 1,
                  meta: {
                     diff: null, // No diff for initial version
                     lineDiff: null,
                     changedFields: [],
                  },
               });
               return c;
            });

            await enqueueContentPlanningJob({
               agentId: input.agentId,
               contentId: created.id,
               contentRequest: {
                  description: input.request.description,
                  layout: input.request.layout,
               },
            });
            return created;
         } catch (err) {
            if (err instanceof DatabaseError) {
               throw APIError.database(err.message);
            }
            throw err;
         }
      }),
   update: protectedProcedure
      .input(ContentUpdateSchema)
      .mutation(async ({ ctx, input }) => {
         const { id, ...updateFields } = input;
         if (!id) {
            throw APIError.validation("Content ID is required for update.");
         }
         try {
            await updateContent((await ctx).db, id, updateFields);
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw APIError.notFound(err.message);
            }
            if (err instanceof DatabaseError) {
               throw APIError.database(err.message);
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
               throw APIError.validation("Content ID is required.");
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
               throw APIError.notFound(err.message);
            }
            if (err instanceof DatabaseError) {
               throw APIError.database(err.message);
            }
            throw err;
         }
      }),
   get: protectedProcedure
      .input(ContentInsertSchema.pick({ id: true }))
      .query(async ({ ctx, input }) => {
         try {
            if (!input.id) {
               throw APIError.validation("Content ID is required.");
            }
            return await getContentById((await ctx).db, input.id);
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw APIError.notFound(err.message);
            }
            if (err instanceof DatabaseError) {
               throw APIError.database(err.message);
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
               throw APIError.validation(
                  "At least one status is required to list content.",
               );
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
               throw APIError.database(err.message);
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
               throw APIError.validation("Content ID is required.");
            }
            const db = (await ctx).db;
            const content = await getContentById(db, input.id);
            if (!content) {
               throw APIError.notFound("Content not found.");
            }
            if (content.status !== "draft") {
               throw APIError.validation("Only draft content can be approved.");
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
               throw APIError.validation(
                  "Content must have keywords in meta to generate ideas.",
               );
            }
            await enqueueIdeasPlanningJob({
               agentId: content.agentId,
               keywords: content.meta?.keywords,
            });
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw APIError.notFound(err.message);
            }
            if (err instanceof DatabaseError) {
               throw APIError.database(err.message);
            }
            throw err;
         }
      }),
   toggleShare: protectedProcedure
      .input(ContentInsertSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         try {
            if (!input.id) {
               throw APIError.validation("Content ID is required.");
            }

            const resolvedCtx = await ctx;
            const db = resolvedCtx.db;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId) {
               throw APIError.unauthorized(
                  "User must be authenticated to toggle share status.",
               );
            }

            // Check if user can modify this content
            const canModify = await canModifyContent(
               db,
               input.id,
               userId,
               organizationId ?? "",
            );

            if (!canModify) {
               throw APIError.forbidden(
                  "You don't have permission to modify this content.",
               );
            }

            // Get content after access check
            const content = await getContentById(db, input.id);
            if (!content) {
               throw APIError.notFound("Content not found.");
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
               throw APIError.notFound(err.message);
            }
            if (err instanceof DatabaseError) {
               throw APIError.database(err.message);
            }
            throw err;
         }
      }),
   getRelatedSlugs: protectedProcedure
      .input(z.object({ slug: z.string(), agentId: z.string() }))
      .query(async ({ ctx, input }) => {
         try {
            if (!input.slug || !input.agentId) {
               throw APIError.validation("Slug and Agent ID are required.");
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
               throw APIError.notFound(err.message);
            }
            if (err instanceof DatabaseError) {
               throw APIError.database(err.message);
            }
            throw err;
         }
      }),
});
