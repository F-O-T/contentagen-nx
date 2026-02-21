import { relations, sql } from "drizzle-orm";
import {
   boolean,
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { content } from "./content";

export const discussions = pgTable(
   "discussions",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      contentId: uuid("content_id")
         .notNull()
         .references(() => content.id, { onDelete: "cascade" }),
      blockId: text("block_id").notNull(),
      userId: text("user_id").notNull(),
      documentContent: text("document_content"),
      isResolved: boolean("is_resolved").notNull().default(false),
      isAi: boolean("is_ai").notNull().default(false),
      createdAt: timestamp("created_at", { withTimezone: true })
         .notNull()
         .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
         .notNull()
         .defaultNow()
         .$onUpdate(() => new Date()),
   },
   (table) => [
      index("discussions_content_id_idx").on(table.contentId),
      index("discussions_user_id_idx").on(table.userId),
   ],
);

export const discussionReplies = pgTable(
   "discussion_replies",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      discussionId: uuid("discussion_id")
         .notNull()
         .references(() => discussions.id, { onDelete: "cascade" }),
      userId: text("user_id").notNull(),
      contentRich: jsonb("content_rich").notNull(),
      isEdited: boolean("is_edited").notNull().default(false),
      isAi: boolean("is_ai").notNull().default(false),
      createdAt: timestamp("created_at", { withTimezone: true })
         .notNull()
         .defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
         .notNull()
         .defaultNow()
         .$onUpdate(() => new Date()),
   },
   (table) => [
      index("discussion_replies_discussion_id_idx").on(table.discussionId),
      index("discussion_replies_user_id_idx").on(table.userId),
   ],
);

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
   content: one(content, {
      fields: [discussions.contentId],
      references: [content.id],
   }),
   replies: many(discussionReplies),
}));

export const discussionRepliesRelations = relations(
   discussionReplies,
   ({ one }) => ({
      discussion: one(discussions, {
         fields: [discussionReplies.discussionId],
         references: [discussions.id],
      }),
   }),
);

export type Discussion = typeof discussions.$inferSelect;
export type NewDiscussion = typeof discussions.$inferInsert;
export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type NewDiscussionReply = typeof discussionReplies.$inferInsert;
