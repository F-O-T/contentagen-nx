import { AppError, propagateError } from "@packages/utils/errors";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   discussionReplies,
   discussions,
   type NewDiscussion,
   type NewDiscussionReply,
} from "../schemas/discussions";

// ─── Discussions ─────────────────────────────────────────────────────────────

export async function createDiscussion(
   db: DatabaseInstance,
   data: Omit<NewDiscussion, "id" | "createdAt" | "updatedAt">,
) {
   try {
      const [discussion] = await db
         .insert(discussions)
         .values(data)
         .returning();
      return discussion;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create discussion");
   }
}

export async function getDiscussionsByContent(
   db: DatabaseInstance,
   contentId: string,
) {
   try {
      const rows = await db
         .select()
         .from(discussions)
         .where(
            and(
               eq(discussions.contentId, contentId),
               eq(discussions.isResolved, false),
            ),
         )
         .orderBy(asc(discussions.createdAt));

      if (rows.length === 0) return [];

      const discussionIds = rows.map((d) => d.id);
      const replies =
         discussionIds.length > 0
            ? await db
                 .select()
                 .from(discussionReplies)
                 .where(inArray(discussionReplies.discussionId, discussionIds))
                 .orderBy(asc(discussionReplies.createdAt))
            : [];

      return rows.map((d) => ({
         ...d,
         comments: replies.filter((r) => r.discussionId === d.id),
      }));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get discussions by content");
   }
}

export async function getDiscussion(db: DatabaseInstance, id: string) {
   try {
      const [discussion] = await db
         .select()
         .from(discussions)
         .where(eq(discussions.id, id))
         .limit(1);
      return discussion ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get discussion");
   }
}

export async function resolveDiscussion(db: DatabaseInstance, id: string) {
   try {
      const [updated] = await db
         .update(discussions)
         .set({ isResolved: true })
         .where(eq(discussions.id, id))
         .returning();
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to resolve discussion");
   }
}

export async function deleteDiscussion(db: DatabaseInstance, id: string) {
   try {
      await db.delete(discussions).where(eq(discussions.id, id));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete discussion");
   }
}

// ─── Replies ─────────────────────────────────────────────────────────────────

export async function addDiscussionReply(
   db: DatabaseInstance,
   data: Omit<NewDiscussionReply, "id" | "createdAt" | "updatedAt">,
) {
   try {
      const [reply] = await db
         .insert(discussionReplies)
         .values(data)
         .returning();
      return reply;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to add discussion reply");
   }
}

export async function updateDiscussionReply(
   db: DatabaseInstance,
   id: string,
   contentRich: unknown,
) {
   try {
      const [updated] = await db
         .update(discussionReplies)
         .set({ contentRich, isEdited: true })
         .where(eq(discussionReplies.id, id))
         .returning();
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update discussion reply");
   }
}

export async function deleteDiscussionReply(db: DatabaseInstance, id: string) {
   try {
      await db.delete(discussionReplies).where(eq(discussionReplies.id, id));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete discussion reply");
   }
}

export async function getDiscussionReply(db: DatabaseInstance, id: string) {
   try {
      const [reply] = await db
         .select()
         .from(discussionReplies)
         .where(eq(discussionReplies.id, id))
         .limit(1);
      return reply ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get discussion reply");
   }
}
