import {
   indexContent,
   initializeRagService,
   isRagAvailable,
   removeContent as removeContentFromRag,
   searchSimilarContent,
} from "@packages/agents/mastra/rag";
import {
   getAgentById,
   getAgentsByOrganizationId,
} from "@packages/database/repositories/agent-repository";
import {
   archiveContent,
   countContentsByOrganization,
   createContent,
   deleteContent,
   getContentById,
   getContentsByAgentId,
   getSharedContentById,
   listContentsByOrganization,
   markContentAsDraft,
   publishContent,
   toggleContentShare,
   updateContent,
} from "@packages/database/repositories/content-repository";
import {
   addRelatedContent as addRelatedContentRepo,
   getPublishedRelatedContent,
   getRelatedContentBySourceId,
   removeRelatedContent as removeRelatedContentRepo,
   updateRelatedContentOrder as updateRelatedOrderRepo,
} from "@packages/database/repositories/related-content-repository";
import {
   ContentMetaSchema,
   ContentRequestSchema,
} from "@packages/database/schema";
import { content } from "@packages/database/schemas/content";
import { normalizeEscapedNewlines } from "@packages/markdown";
import { APIError, propagateError } from "@packages/utils/errors";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const contentRouter = router({
   listAllContent: protectedProcedure
      .input(
         z.object({
            limit: z.number().min(1).max(100).optional().default(20),
            page: z.number().min(1).optional().default(1),
            status: z
               .array(z.enum(["draft", "published", "archived"]))
               .optional(),
            agentId: z.string().uuid().optional(), // Filter by specific agent
            manualOnly: z.boolean().optional(), // Filter for manual content only
         }),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         if (!organizationId) {
            throw APIError.unauthorized("Organization must be specified.");
         }

         // Get total count for pagination
         const total = await countContentsByOrganization(
            resolvedCtx.db,
            organizationId,
            input.status as ("draft" | "published" | "archived")[] | undefined,
         );

         if (total === 0) {
            return {
               items: [],
               limit: input.limit,
               page: input.page,
               total: 0,
               totalPages: 0,
            };
         }

         // Get all agents for this organization (for displaying agent info)
         const agents = await getAgentsByOrganizationId(
            resolvedCtx.db,
            organizationId,
         );

         // Create a map of agent IDs to agent info for quick lookup
         const agentMap = new Map(
            agents.map((agent) => [
               agent.id,
               {
                  id: agent.id,
                  name: agent.personaConfig.metadata.name,
                  profilePhotoUrl: agent.profilePhotoUrl,
               },
            ]),
         );

         // Get content using the new organization-based query
         const offset = (input.page - 1) * input.limit;
         const items = await listContentsByOrganization(
            resolvedCtx.db,
            organizationId,
            {
               statuses: input.status as
                  | ("draft" | "published" | "archived")[]
                  | undefined,
               agentId: input.manualOnly ? null : input.agentId,
               limit: input.limit,
               offset,
            },
         );

         const totalPages = Math.ceil(total / input.limit);

         // Add agent info to each item (null for manual content)
         const itemsWithAgent = items.map((item) => ({
            ...item,
            agent: item.agentId ? (agentMap.get(item.agentId) ?? null) : null,
         }));

         return {
            items: itemsWithAgent,
            limit: input.limit,
            page: input.page,
            total,
            totalPages,
         };
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         if (!organizationId) {
            throw APIError.unauthorized("Organization must be specified.");
         }

         const contentItem = await getContentById(resolvedCtx.db, input.id);

         if (!contentItem) {
            throw APIError.notFound("Content not found.");
         }

         // Verify content belongs to the requesting organization
         if (contentItem.organizationId !== organizationId) {
            throw APIError.forbidden(
               "You don't have permission to view this content.",
            );
         }

         // Get agent info if content has an agent
         let agentInfo = null;
         if (contentItem.agentId) {
            const agent = await getAgentById(
               resolvedCtx.db,
               contentItem.agentId,
            );
            if (agent) {
               agentInfo = {
                  id: agent.id,
                  name: agent.personaConfig.metadata.name,
                  profilePhotoUrl: agent.profilePhotoUrl,
               };
            }
         }

         return {
            ...contentItem,
            agent: agentInfo,
         };
      }),

   getByAgentId: protectedProcedure
      .input(
         z.object({
            agentId: z.string().uuid(),
            limit: z.number().min(1).max(100).optional().default(20),
            page: z.number().min(1).optional().default(1),
            status: z
               .array(z.enum(["draft", "published", "archived"]))
               .optional(),
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify agent belongs to organization
            const agent = await getAgentById(resolvedCtx.db, input.agentId);
            if (!agent) {
               throw APIError.notFound("Writer not found.");
            }
            if (agent.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to view this writer's content.",
               );
            }

            const contents = await getContentsByAgentId(
               resolvedCtx.db,
               input.agentId,
            );

            // Filter by status
            let filteredContents = contents;
            if (input.status && input.status.length > 0) {
               filteredContents = contents.filter((item) =>
                  input.status!.includes(
                     item.status as "draft" | "published" | "archived",
                  ),
               );
            }

            // Paginate
            const total = filteredContents.length;
            const totalPages = Math.ceil(total / input.limit);
            const start = (input.page - 1) * input.limit;
            const end = start + input.limit;
            const paginatedItems = filteredContents.slice(start, end);

            return {
               items: paginatedItems,
               limit: input.limit,
               page: input.page,
               total,
               totalPages,
            };
         } catch (err) {
            console.error("Error getting content by agent:", err);
            propagateError(err);
            throw APIError.internal("Failed to get content.");
         }
      }),

   create: protectedProcedure
      .input(
         z.object({
            agentId: z.string().uuid().optional(), // Optional for manual content
            body: z.string().optional().default(""),
            meta: ContentMetaSchema.optional(),
            request: ContentRequestSchema.optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;
            const memberId = resolvedCtx.memberId;

            if (!organizationId || !memberId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization.",
               );
            }

            // If agentId is provided, verify it belongs to organization
            if (input.agentId) {
               const agent = await getAgentById(resolvedCtx.db, input.agentId);
               if (!agent) {
                  throw APIError.notFound("Writer not found.");
               }
               if (agent.organizationId !== organizationId) {
                  throw APIError.forbidden(
                     "You don't have permission to create content for this writer.",
                  );
               }
            }

            // Provide default meta if not supplied
            const meta = input.meta ?? {
               title: "Untitled",
               description: "",
               slug: `untitled-${Date.now()}`,
            };

            // Normalize escaped newlines in body content
            const normalizedBody = normalizeEscapedNewlines(input.body);

            const created = await createContent(resolvedCtx.db, {
               agentId: input.agentId ?? null,
               organizationId,
               body: normalizedBody,
               createdByMemberId: memberId,
               meta,
               request: input.request,
               draftOrigin: input.agentId ? "ai_generated" : "manual",
            });

            return created;
         } catch (err) {
            console.error("Error creating content:", err);
            propagateError(err);
            throw APIError.internal("Failed to create content.");
         }
      }),

   update: protectedProcedure
      .input(
         z.object({
            data: z.object({
               body: z.string().optional(),
               meta: ContentMetaSchema.partial().optional(),
               agentId: z.string().uuid().nullable().optional(),
            }),
            id: z.string().uuid(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            const existing = await getContentById(resolvedCtx.db, input.id);
            if (!existing) {
               throw APIError.notFound("Content not found.");
            }

            // Verify content belongs to organization
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to update this content.",
               );
            }

            // Handle agentId update (writer assignment)
            if (input.data.agentId !== undefined) {
               // If assigning a writer, verify it belongs to the organization
               if (input.data.agentId !== null) {
                  const agent = await getAgentById(
                     resolvedCtx.db,
                     input.data.agentId,
                  );
                  if (!agent || agent.organizationId !== organizationId) {
                     throw APIError.forbidden("Invalid writer.");
                  }
               }
               await updateContent(resolvedCtx.db, input.id, {
                  agentId: input.data.agentId,
                  draftOrigin: input.data.agentId ? "ai_generated" : "manual",
               });
            }

            // Handle body update using the repository function
            if (input.data.body !== undefined) {
               // Normalize escaped newlines in body content
               const normalizedBody = normalizeEscapedNewlines(input.data.body);
               await updateContent(resolvedCtx.db, input.id, {
                  body: normalizedBody,
               });
            }

            // Handle meta update using atomic JSONB merge to prevent race conditions
            // This uses PostgreSQL's || operator which merges JSONB objects atomically
            if (input.data.meta) {
               await resolvedCtx.db
                  .update(content)
                  .set({
                     meta: sql`COALESCE(${content.meta}, '{}'::jsonb) || ${JSON.stringify(input.data.meta)}::jsonb`,
                  })
                  .where(eq(content.id, input.id));
            }

            // Fetch and return the updated content
            const updated = await getContentById(resolvedCtx.db, input.id);
            return updated;
         } catch (err) {
            console.error("Error updating content:", err);
            propagateError(err);
            throw APIError.internal("Failed to update content.");
         }
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            const existing = await getContentById(resolvedCtx.db, input.id);
            if (!existing) {
               throw APIError.notFound("Content not found.");
            }

            // Verify content belongs to organization
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to delete this content.",
               );
            }

            // Remove from RAG index before deleting
            if (isRagAvailable()) {
               initializeRagService()
                  .then(() => removeContentFromRag(input.id))
                  .catch((err) => {
                     console.error(
                        "Failed to remove deleted content from RAG:",
                        err,
                     );
                  });
            }

            await deleteContent(resolvedCtx.db, input.id);
            return { success: true };
         } catch (err) {
            console.error("Error deleting content:", err);
            propagateError(err);
            throw APIError.internal("Failed to delete content.");
         }
      }),

   publish: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            const existing = await getContentById(resolvedCtx.db, input.id);
            if (!existing) {
               throw APIError.notFound("Content not found.");
            }

            // Verify content belongs to organization
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to publish this content.",
               );
            }

            const published = await publishContent(resolvedCtx.db, input.id);

            if (!published) {
               throw APIError.internal("Failed to publish content.");
            }

            // Index content for RAG (async, don't block publish)
            // Only index if content has an agent (RAG is per-agent)
            const publishedAgentId = published.agentId;
            if (isRagAvailable() && publishedAgentId) {
               initializeRagService()
                  .then(() =>
                     indexContent({
                        id: published.id,
                        agentId: publishedAgentId,
                        slug: published.meta.slug,
                        title: published.meta.title,
                        description: published.meta.description,
                        keywords: published.meta.keywords,
                        body: published.body || "",
                     }),
                  )
                  .catch((err) => {
                     console.error(
                        "Failed to index published content for RAG:",
                        err,
                     );
                  });
            }

            return published;
         } catch (err) {
            console.error("Error publishing content:", err);
            propagateError(err);
            throw APIError.internal("Failed to publish content.");
         }
      }),

   archive: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            const existing = await getContentById(resolvedCtx.db, input.id);
            if (!existing) {
               throw APIError.notFound("Content not found.");
            }

            // Verify content belongs to organization
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to archive this content.",
               );
            }

            const archived = await archiveContent(resolvedCtx.db, input.id);

            // Remove from RAG index (async, don't block archive)
            if (isRagAvailable()) {
               initializeRagService()
                  .then(() => removeContentFromRag(input.id))
                  .catch((err) => {
                     console.error(
                        "Failed to remove archived content from RAG:",
                        err,
                     );
                  });
            }

            return archived;
         } catch (err) {
            console.error("Error archiving content:", err);
            propagateError(err);
            throw APIError.internal("Failed to archive content.");
         }
      }),

   markAsDraft: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            const existing = await getContentById(resolvedCtx.db, input.id);
            if (!existing) {
               throw APIError.notFound("Content not found.");
            }

            // Verify content belongs to organization
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to update this content.",
               );
            }

            const updated = await markContentAsDraft(resolvedCtx.db, input.id);

            // Remove from RAG index if was published (draft content shouldn't be indexed)
            if (existing.status === "published" && isRagAvailable()) {
               initializeRagService()
                  .then(() => removeContentFromRag(input.id))
                  .catch((err) => {
                     console.error(
                        "Failed to remove draft content from RAG:",
                        err,
                     );
                  });
            }

            return updated;
         } catch (err) {
            console.error("Error marking content as draft:", err);
            propagateError(err);
            throw APIError.internal("Failed to mark content as draft.");
         }
      }),

   toggleShare: protectedProcedure
      .input(z.object({ id: z.string().uuid(), shared: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            const existing = await getContentById(resolvedCtx.db, input.id);
            if (!existing) {
               throw APIError.notFound("Content not found.");
            }

            // Verify content belongs to organization
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to share this content.",
               );
            }

            // Only published content can be shared
            if (input.shared && existing.status !== "published") {
               throw APIError.validation(
                  "Only published content can be shared publicly.",
               );
            }

            const updated = await toggleContentShare(
               resolvedCtx.db,
               input.id,
               input.shared,
            );

            return updated;
         } catch (err) {
            console.error("Error toggling content share:", err);
            propagateError(err);
            throw APIError.internal("Failed to toggle content share.");
         }
      }),

   // Public endpoint - no auth required
   getSharedContent: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const sharedContent = await getSharedContentById(
               resolvedCtx.db,
               input.id,
            );

            if (!sharedContent) {
               throw APIError.notFound("Content not found or not shared.");
            }

            // Get related posts (only published and shared)
            const relatedPosts = await getPublishedRelatedContent(
               resolvedCtx.db,
               input.id,
            );

            // Return only public-safe fields
            return {
               id: sharedContent.id,
               body: sharedContent.body,
               imageUrl: sharedContent.imageUrl,
               meta: sharedContent.meta,
               stats: sharedContent.stats,
               status: sharedContent.status,
               createdAt: sharedContent.createdAt,
               agent: sharedContent.agent
                  ? {
                       name: sharedContent.agent.personaConfig?.metadata?.name,
                       description:
                          sharedContent.agent.personaConfig?.metadata
                             ?.description,
                       avatar:
                          sharedContent.agent.personaConfig?.metadata?.avatar,
                       profilePhotoUrl: sharedContent.agent.profilePhotoUrl,
                    }
                  : null,
               relatedPosts: relatedPosts.map((p) => ({
                  id: p.id,
                  title: p.meta.title,
                  description: p.meta.description,
                  slug: p.meta.slug,
                  imageUrl: p.imageUrl,
               })),
            };
         } catch (err) {
            console.error("Error getting shared content:", err);
            propagateError(err);
            throw APIError.internal("Failed to get shared content.");
         }
      }),

   // Related content endpoints
   getRelatedContent: protectedProcedure
      .input(z.object({ contentId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify ownership
            const contentItem = await getContentById(
               resolvedCtx.db,
               input.contentId,
            );
            if (!contentItem) {
               throw APIError.notFound("Content not found.");
            }

            if (contentItem.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to view this content.",
               );
            }

            return getRelatedContentBySourceId(resolvedCtx.db, input.contentId);
         } catch (err) {
            console.error("Error getting related content:", err);
            propagateError(err);
            throw APIError.internal("Failed to get related content.");
         }
      }),

   addRelatedContent: protectedProcedure
      .input(
         z.object({
            sourceContentId: z.string().uuid(),
            targetContentId: z.string().uuid(),
            relationType: z
               .enum(["manual", "ai_suggested"])
               .optional()
               .default("manual"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify both contents belong to the organization
            const [source, target] = await Promise.all([
               getContentById(resolvedCtx.db, input.sourceContentId),
               getContentById(resolvedCtx.db, input.targetContentId),
            ]);

            if (!source || !target) {
               throw APIError.notFound("Content not found.");
            }

            // Verify ownership of both contents
            if (
               source.organizationId !== organizationId ||
               target.organizationId !== organizationId
            ) {
               throw APIError.forbidden(
                  "You don't have permission to link this content.",
               );
            }

            return addRelatedContentRepo(resolvedCtx.db, input);
         } catch (err) {
            console.error("Error adding related content:", err);
            propagateError(err);
            throw APIError.internal("Failed to add related content.");
         }
      }),

   removeRelatedContent: protectedProcedure
      .input(
         z.object({
            sourceContentId: z.string().uuid(),
            targetContentId: z.string().uuid(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify ownership of source content
            const source = await getContentById(
               resolvedCtx.db,
               input.sourceContentId,
            );
            if (!source) {
               throw APIError.notFound("Content not found.");
            }

            if (source.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to modify this content.",
               );
            }

            return removeRelatedContentRepo(
               resolvedCtx.db,
               input.sourceContentId,
               input.targetContentId,
            );
         } catch (err) {
            console.error("Error removing related content:", err);
            propagateError(err);
            throw APIError.internal("Failed to remove related content.");
         }
      }),

   updateRelatedContentOrder: protectedProcedure
      .input(
         z.object({
            sourceContentId: z.string().uuid(),
            orderedTargetIds: z.array(z.string().uuid()),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify ownership
            const source = await getContentById(
               resolvedCtx.db,
               input.sourceContentId,
            );
            if (!source) {
               throw APIError.notFound("Content not found.");
            }

            if (source.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to modify this content.",
               );
            }

            return updateRelatedOrderRepo(
               resolvedCtx.db,
               input.sourceContentId,
               input.orderedTargetIds,
            );
         } catch (err) {
            console.error("Error updating related content order:", err);
            propagateError(err);
            throw APIError.internal("Failed to update related content order.");
         }
      }),

   // AI-powered related content suggestions using RAG
   getRelatedContentSuggestions: protectedProcedure
      .input(z.object({ contentId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // 1. Get the content
            const contentItem = await getContentById(
               resolvedCtx.db,
               input.contentId,
            );
            if (!contentItem) {
               throw APIError.notFound("Content not found.");
            }

            // Verify ownership
            if (contentItem.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to view this content.",
               );
            }

            // 2. Check if RAG is available (only works for agent-based content)
            if (!isRagAvailable() || !contentItem.agentId) {
               return { suggestions: [], available: false };
            }

            // 3. Initialize RAG and search for similar content
            await initializeRagService();

            // Build search query from title + description + keywords
            const queryParts = [
               contentItem.meta.title,
               contentItem.meta.description,
               ...(contentItem.meta.keywords || []),
            ].filter(Boolean);
            const query = queryParts.join(" ");

            const results = await searchSimilarContent({
               query,
               agentId: contentItem.agentId,
               limit: 10,
               minScore: 0.4,
            });

            // 4. Get already-linked content to exclude
            const existing = await getRelatedContentBySourceId(
               resolvedCtx.db,
               input.contentId,
            );
            const excludeIds = new Set([
               input.contentId,
               ...existing.map((r) => r.targetContentId),
            ]);

            // 5. Filter and format suggestions
            const suggestions = results
               .filter((r) => !excludeIds.has(r.externalId))
               .map((r) => ({
                  id: r.externalId,
                  title: r.title,
                  description: r.description,
                  slug: r.slug,
                  relevance: Math.round(r.relevance * 100),
               }));

            return { suggestions, available: true };
         } catch (err) {
            console.error("Error getting related content suggestions:", err);
            propagateError(err);
            throw APIError.internal("Failed to get suggestions.");
         }
      }),
});
