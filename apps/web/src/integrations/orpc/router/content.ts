import { ORPCError } from "@orpc/server";
import {
   archiveContent,
   countContentsByOrganization,
   createContent,
   deleteContent,
   getContentById,
   listContentsByOrganization,
   publishContent,
   updateContent,
} from "@packages/database/repositories/content-repository";
import { ContentMetaSchema } from "@packages/database/schemas/content";
import {
   CONTENT_EVENTS,
   emitContentArchived,
   emitContentCreated,
   emitContentDeleted,
   emitContentPublished,
   emitContentUpdated,
} from "@packages/events/content";
import { enforceCreditBudget, trackCreditUsage } from "@packages/events/credits";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const createContentSchema = z.object({
   meta: ContentMetaSchema,
   body: z.string().optional(),
   draftOrigin: z.enum(["manual", "ai_generated"]).optional().default("manual"),
});

const updateContentSchema = z.object({
   meta: ContentMetaSchema.partial().optional(),
   body: z.string().optional(),
});

// =============================================================================
// Content Procedures
// =============================================================================

/**
 * Get content by ID
 */
export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const contentItem = await getContentById(db, input.id);

      if (!contentItem || contentItem.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Conteudo nao encontrado.",
         });
      }

      return contentItem;
   });

/**
 * Create new content
 */
export const create = protectedProcedure
   .input(createContentSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db, session, posthog, userId, teamId } = context;

      // Get member ID from session
      const memberId = session.session.activeOrganizationId
         ? session.user.id
         : null;

      if (!memberId) {
         throw new ORPCError("FORBIDDEN", {
            message: "Membro da organizacao nao encontrado.",
         });
      }

      // Find member in organization
      const members = await db.query.member.findMany({
         where: (member, { eq, and }) =>
            and(
               eq(member.organizationId, organizationId),
               eq(member.userId, session.user.id),
            ),
      });

      if (members.length === 0) {
         throw new ORPCError("FORBIDDEN", {
            message: "Voce nao e membro desta organizacao.",
         });
      }

      const result = await createContent(db, {
         ...input,
         organizationId,
         createdByMemberId: members[0].id,
      });

      try {
         await emitContentCreated(
            { db, posthog, organizationId, userId, teamId },
            { contentId: result.id, title: input.meta.title ?? "" },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return result;
   });

/**
 * Update content
 */
export const update = protectedProcedure
   .input(
      z.object({
         id: z.string().uuid(),
         data: updateContentSchema,
      }),
   )
   .handler(async ({ context, input }) => {
      const { organizationId, db, posthog, userId, teamId } = context;

      // Verify ownership
      const existing = await getContentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Conteudo nao encontrado.",
         });
      }

      await enforceCreditBudget(db, organizationId, "platform");

      // Build update data, merging partial meta with existing
      const updateData: Parameters<typeof updateContent>[2] = {};

      if (input.data.body !== undefined) {
         updateData.body = input.data.body;
      }

      if (input.data.meta) {
         // Merge partial meta with existing meta
         updateData.meta = {
            ...existing.meta,
            ...input.data.meta,
         };
      }

      const result = await updateContent(db, input.id, updateData);

      try {
         const changedFields: string[] = [];
         if (input.data.body !== undefined) {
            changedFields.push("body");
         }
         if (input.data.meta) {
            changedFields.push(...Object.keys(input.data.meta));
         }

         await emitContentUpdated(
            { db, posthog, organizationId, userId, teamId },
            { contentId: input.id, changedFields },
         );
         await trackCreditUsage(
            db,
            CONTENT_EVENTS["content.page.updated"],
            organizationId,
            "platform",
         );
      } catch {
         // Event emission must not break the main flow
      }

      return result;
   });

/**
 * Delete content
 */
export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db, posthog, userId, teamId } = context;

      // Verify ownership
      const existing = await getContentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Conteudo nao encontrado.",
         });
      }

      const result = await deleteContent(db, input.id);

      try {
         await emitContentDeleted(
            { db, posthog, organizationId, userId, teamId },
            { contentId: input.id },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return result;
   });

/**
 * Publish content
 */
export const publish = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db, posthog, userId, teamId } = context;

      // Verify ownership
      const existing = await getContentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Conteudo nao encontrado.",
         });
      }

      await enforceCreditBudget(db, organizationId, "platform");

      const result = await publishContent(db, input.id);

      try {
         const wordCount =
            existing.body?.split(/\s+/).filter(Boolean).length ?? 0;

         await emitContentPublished(
            { db, posthog, organizationId, userId, teamId },
            {
               contentId: input.id,
               title: existing.meta?.title ?? "",
               slug: existing.meta?.slug ?? "",
               wordCount,
            },
         );
         await trackCreditUsage(
            db,
            CONTENT_EVENTS["content.page.published"],
            organizationId,
            "platform",
         );
      } catch {
         // Event emission must not break the main flow
      }

      return result;
   });

/**
 * Archive content
 */
export const archive = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db, posthog, userId, teamId } = context;

      // Verify ownership
      const existing = await getContentById(db, input.id);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Conteudo nao encontrado.",
         });
      }

      const result = await archiveContent(db, input.id);

      try {
         await emitContentArchived(
            { db, posthog, organizationId, userId, teamId },
            { contentId: input.id },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return result;
   });

/**
 * List all content for the organization with pagination and filters
 */
export const listAllContent = protectedProcedure
   .input(
      z.object({
         limit: z.number().min(1).max(100).optional().default(20),
         page: z.number().min(1).optional().default(1),
         status: z
            .array(z.enum(["draft", "published", "archived"]).optional())
            .optional(),
         manualOnly: z.boolean().optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      if (!organizationId) {
         throw new ORPCError("UNAUTHORIZED", {
            message: "Organization must be specified.",
         });
      }

      // Get total count for pagination
      const total = await countContentsByOrganization(
         db,
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

      // Get content using the organization-based query
      const offset = (input.page - 1) * input.limit;
      const items = await listContentsByOrganization(db, organizationId, {
         statuses: input.status as
            | ("draft" | "published" | "archived")[]
            | undefined,
         limit: input.limit,
         offset,
      });

      const totalPages = Math.ceil(total / input.limit);

      return {
         items,
         limit: input.limit,
         page: input.page,
         total,
         totalPages,
      };
   });
