import { ORPCError } from "@orpc/server";
import { getContentById } from "@packages/database/repositories/content-repository";
import {
   addDiscussionReply,
   createDiscussion,
   deleteDiscussion,
   deleteDiscussionReply,
   getDiscussion,
   getDiscussionReply,
   getDiscussionsByContent,
   resolveDiscussion,
   updateDiscussionReply,
} from "@packages/database/repositories/discussion-repository";
import { user } from "@packages/database/schemas/auth";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const contentRichSchema = z.array(z.record(z.string(), z.unknown()));

// =============================================================================
// Discussion Procedures
// =============================================================================

export const getByContent = protectedProcedure
   .input(z.object({ contentId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const content = await getContentById(db, input.contentId);

      if (!content || content.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Content not found.",
         });
      }

      const discussionList = await getDiscussionsByContent(db, input.contentId);

      if (discussionList.length === 0) {
         return { discussions: [], users: {} };
      }

      // Collect all unique user IDs from discussions and their replies
      const userIds = new Set<string>();
      for (const discussion of discussionList) {
         userIds.add(discussion.userId);
         for (const comment of discussion.comments) {
            userIds.add(comment.userId);
         }
      }

      const userIdArray = Array.from(userIds);
      const userRows =
         userIdArray.length > 0
            ? await db
                 .select({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                 })
                 .from(user)
                 .where(inArray(user.id, userIdArray))
            : [];

      const usersMap: Record<
         string,
         { id: string; name: string; email: string; image: string }
      > = {};
      for (const u of userRows) {
         usersMap[u.id] = {
            id: u.id,
            name: u.name,
            email: u.email,
            image:
               u.image ?? `https://api.dicebear.com/9.x/glass/svg?seed=${u.id}`,
         };
      }

      return { discussions: discussionList, users: usersMap };
   });

export const create = protectedProcedure
   .input(
      z.object({
         contentId: z.string().uuid(),
         blockId: z.string(),
         contentRich: contentRichSchema,
         documentContent: z.string().optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { organizationId, db, userId } = context;

      const content = await getContentById(db, input.contentId);

      if (!content || content.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Content not found.",
         });
      }

      const discussion = await createDiscussion(db, {
         contentId: input.contentId,
         blockId: input.blockId,
         userId,
         documentContent: input.documentContent,
      });

      const reply = await addDiscussionReply(db, {
         discussionId: discussion.id,
         userId,
         contentRich: input.contentRich,
      });

      return { discussion, reply };
   });

export const addReply = protectedProcedure
   .input(
      z.object({
         discussionId: z.string().uuid(),
         contentRich: contentRichSchema,
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, userId } = context;

      const discussion = await getDiscussion(db, input.discussionId);

      if (!discussion) {
         throw new ORPCError("NOT_FOUND", {
            message: "Discussion not found.",
         });
      }

      const reply = await addDiscussionReply(db, {
         discussionId: input.discussionId,
         userId,
         contentRich: input.contentRich,
      });

      return reply;
   });

export const resolve = protectedProcedure
   .input(z.object({ discussionId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, userId } = context;

      const discussion = await getDiscussion(db, input.discussionId);

      if (!discussion) {
         throw new ORPCError("NOT_FOUND", {
            message: "Discussion not found.",
         });
      }

      if (discussion.userId !== userId) {
         throw new ORPCError("FORBIDDEN", {
            message: "You do not have permission to resolve this discussion.",
         });
      }

      const updated = await resolveDiscussion(db, input.discussionId);

      return updated;
   });

export const remove = protectedProcedure
   .input(z.object({ discussionId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, userId } = context;

      const discussion = await getDiscussion(db, input.discussionId);

      if (!discussion) {
         throw new ORPCError("NOT_FOUND", {
            message: "Discussion not found.",
         });
      }

      if (discussion.userId !== userId) {
         throw new ORPCError("FORBIDDEN", {
            message: "You do not have permission to delete this discussion.",
         });
      }

      await deleteDiscussion(db, input.discussionId);

      return { success: true };
   });

export const updateReply = protectedProcedure
   .input(
      z.object({
         replyId: z.string().uuid(),
         contentRich: contentRichSchema,
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, userId } = context;

      const reply = await getDiscussionReply(db, input.replyId);

      if (!reply) {
         throw new ORPCError("NOT_FOUND", {
            message: "Reply not found.",
         });
      }

      if (reply.userId !== userId) {
         throw new ORPCError("FORBIDDEN", {
            message: "You do not have permission to update this reply.",
         });
      }

      const updated = await updateDiscussionReply(
         db,
         input.replyId,
         input.contentRich,
      );

      return updated;
   });

export const removeReply = protectedProcedure
   .input(z.object({ replyId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, userId } = context;

      const reply = await getDiscussionReply(db, input.replyId);

      if (!reply) {
         throw new ORPCError("NOT_FOUND", {
            message: "Reply not found.",
         });
      }

      if (reply.userId !== userId) {
         throw new ORPCError("FORBIDDEN", {
            message: "You do not have permission to delete this reply.",
         });
      }

      await deleteDiscussionReply(db, input.replyId);

      return { success: true };
   });
