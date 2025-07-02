import { relations } from "drizzle-orm";
import {
   boolean,
   index,
   integer,
   json,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
   vector,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const contentTypeEnum = pgEnum("content_type", [
   "blog_posts",
   "social_media",
   "marketing_copy",
   "technical_docs",
]);
export type ContentType = (typeof contentTypeEnum.enumValues)[number];

export const voiceToneEnum = pgEnum("voice_tone", [
   "professional",
   "conversational",
   "educational",
   "creative",
]);
export type VoiceTone = (typeof voiceToneEnum.enumValues)[number];

export const targetAudienceEnum = pgEnum("target_audience", [
   "general_public",
   "professionals",
   "beginners",
   "customers",
]);
export type TargetAudience = (typeof targetAudienceEnum.enumValues)[number];

export const formattingStyleEnum = pgEnum("formatting_style", [
   "structured",
   "narrative",
   "list_based",
]);
export type FormattingStyle = (typeof formattingStyleEnum.enumValues)[number];

export const contentStatusEnum = pgEnum("content_status", [
   "draft",
   "review",
   "published",
   "archived",
]);
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];

export const contentLengthEnum = pgEnum("content_length", [
   "short",
   "medium",
   "long",
]);
export type ContentLength = (typeof contentLengthEnum.enumValues)[number];

export const priorityEnum = pgEnum("priority", [
   "low",
   "normal",
   "high",
   "urgent",
]);
export type Priority = (typeof priorityEnum.enumValues)[number];

export const internalLinkFormatEnum = pgEnum("internal_link_format", [
   "mdx",
   "html",
]);
export type InternalLinkFormat = (typeof internalLinkFormatEnum.enumValues)[number];

export const agent = pgTable("agent", {
   contentType: contentTypeEnum("content_type").notNull(),
   createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
   description: text("description"),
   formattingStyle:
      formattingStyleEnum("formatting_style").default("structured"),
   id: uuid("id").primaryKey().defaultRandom(),

   isActive: boolean("is_active").default(true),
   lastGeneratedAt: timestamp("last_generated_at"),
   name: text("name").notNull(),
   targetAudience: targetAudienceEnum("target_audience").notNull(),
   totalDrafts: integer("total_drafts").default(0),
   totalPublished: integer("total_published").default(0),
   updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
   voiceTone: voiceToneEnum("voice_tone").notNull(),
   uploadedFiles: json("uploaded_files").$type<{ fileName: string; fileUrl: string; uploadedAt: string }[]>().default([]),
   knowledgeBase: vector("knowledge_base", { dimensions: 1536 }),
   basePrompt: text("base_prompt"),
}, (table) => ([
   index("agent_knowledge_base_idx").using(
      "hnsw",
      table.knowledgeBase.op("vector_cosine_ops"),
   ),
]));

export const content = pgTable(
   "content",
   {
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
      embedding: vector("embedding", { dimensions: 1536 }),
   },
   (table) => ([
      index("content_embedding_idx").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
   ]),
);


export const contentRequest = pgTable(
   "content_request",
   {
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
      targetLength: contentLengthEnum("target_length")
         .default("medium")
         .notNull(),
      topic: text("topic").notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
      userId: text("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      internalLinkFormat: internalLinkFormatEnum("internal_link_format").default("mdx"),
      includeMetaTags: boolean("include_meta_tags").default(false),
      includeMetaDescription: boolean("include_meta_description").default(false),
      approved: boolean("approved").default(true),
   }
   
);


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



export const agentRelations = relations(agent, ({ one, many }) => ({
   content: many(content),
   contentRequests: many(contentRequest),
   user: one(user, {
      fields: [agent.userId],
      references: [user.id],
   }),
}));

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
