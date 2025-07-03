import { relations } from "drizzle-orm";
import {
   boolean,
   integer,
   json,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { agent } from "./agent-schema";

export const contentStatusEnum = pgEnum("content_status", [
   "draft",
   "review",
   "published",
   "archived",
]);
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];

export const content = pgTable("content", {
   agentId: uuid("agent_id")
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
   body: text("body").notNull(),
   createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
   id: uuid("id").primaryKey().defaultRandom(),
   readTimeMinutes: integer("read_time_minutes").default(0),
   slug: text("slug"),
   status: contentStatusEnum("status").default("draft"),
   tags: json("tags").$type<string[]>(),
   title: text("title").notNull(),
   updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
   wordsCount: integer("words_count"),
   qualityScore: integer("quality_score"),
   topics: json("topics").$type<string[]>(),
   sources: json("sources").$type<string[]>(),
});

export const contentRequest = pgTable("content_request", {
   agentId: uuid("agent_id")
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
   briefDescription: text("brief_description").notNull(),
   createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
   generatedContentId: uuid("generated_content_id").references(
      () => content.id,
      { onDelete: "cascade" },
   ),
   id: uuid("id").primaryKey().defaultRandom(),
   isCompleted: boolean("is_completed").default(false),
   topic: text("topic").notNull(),
   updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
   approved: boolean("approved").default(true),
   // --- Custom fields for advanced content requests ---
   targetLength: integer("target_length"),
   internalLinkFormat: text("internal_link_format"),
   includeMetaTags: boolean("include_meta_tags"),
   includeMetaDescription: boolean("include_meta_description"),
   // Add embedding to contentRequest schema for compatibility with update logic
   embedding: json("embedding").$type<number[]>(),
});

export const exportLog = pgTable("export_log", {
   contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),

   createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
   filename: text("filename").notNull(),
   format: text("format").notNull(),
   id: text("id").primaryKey(),
   options: json("options").$type<Record<string, unknown>>().default({}),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});

export const contentRelations = relations(content, ({ one, many }) => ({
   agent: one(agent, {
      fields: [content.agentId],
      references: [agent.id],
   }),

   exports: many(exportLog),
   generationRequest: one(contentRequest, {
      fields: [content.id],
      references: [contentRequest.generatedContentId],
   }),
   user: one(user, {
      fields: [content.userId],
      references: [user.id],
   }),
}));

export const contentRequestRelations = relations(contentRequest, ({ one }) => ({
   agent: one(agent, {
      fields: [contentRequest.agentId],
      references: [agent.id],
   }),
   generatedContent: one(content, {
      fields: [contentRequest.generatedContentId],
      references: [content.id],
   }),
   user: one(user, {
      fields: [contentRequest.userId],
      references: [user.id],
   }),
}));

export const exportLogRelations = relations(exportLog, ({ one }) => ({
   content: one(content, {
      fields: [exportLog.contentId],
      references: [content.id],
   }),
   user: one(user, {
      fields: [exportLog.userId],
      references: [user.id],
   }),
}));
