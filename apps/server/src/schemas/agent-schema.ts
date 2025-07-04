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
import { z } from "zod";

// Enums (copied from content-schema for now, can be refactored later)
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

export const languageEnum = pgEnum("language", ["english", "portuguese"]);
export type Language = (typeof languageEnum.enumValues)[number];

export const brandIntegrationEnum = pgEnum("brand_integration", [
   "strict_guideline",
   "flexible_guideline",
   "reference_only",
   "creative_blend",
]);
export type BrandIntegration = (typeof brandIntegrationEnum.enumValues)[number];

export const communicationStyleEnum = pgEnum("communication_style", [
   "first_person",
   "third_person",
]);
export type CommunicationStyle =
   (typeof communicationStyleEnum.enumValues)[number];

// Agent table (without knowledgeBase, to be added: knowledge_chunk table)
export const agent = pgTable(
   "agent",
   {
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
      uploadedFiles: json("uploaded_files")
         .$type<{ fileName: string; fileUrl: string; uploadedAt: string }[]>()
         .default([]),
      basePrompt: text("base_prompt"),
      language: languageEnum("language").notNull(), // New field
      brandIntegration: brandIntegrationEnum("brand_integration").notNull(), // New field
      communicationStyle: communicationStyleEnum("communication_style")
         .default("first_person")
         .notNull(), // Now uses enum
   },
   (table) => [index("agent_user_id_idx").on(table.userId)],
);

// Knowledge chunk table for Brand Brain
export const knowledgeSourceEnum = pgEnum("knowledge_source", [
   "brand_knowledge",
   "knowledge_point",
]);
export type KnowledgeSource = (typeof knowledgeSourceEnum.enumValues)[number];

export const knowledgeChunk = pgTable(
   "knowledge_chunk",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      agentId: uuid("agent_id")
         .notNull()
         .references(() => agent.id, { onDelete: "cascade" }),
      content: text("content").notNull(),
      summary: text("summary"),
      category: text("category"),
      keywords: json("keywords").$type<string[]>(),
      source: knowledgeSourceEnum("source").notNull(),
      sourceType: text("source_type"),
      sourceIdentifier: text("source_identifier"),
      embedding: vector("embedding", { dimensions: 1536 }),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("knowledge_chunk_agent_id_idx").on(table.agentId),
      index("knowledge_chunk_embedding_idx").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
   ],
);

// --- ZOD SCHEMAS FOR KNOWLEDGE CHUNK ---
export const knowledgeChunkSchema = z.object({
   id: z.string().uuid(),
   agentId: z.string().uuid(),
   source: z.enum(["brand_knowledge", "knowledge_point"]),
   content: z.string(),
   summary: z.string().optional(),
   category: z.string().optional(),
   keywords: z.array(z.string()).optional(),
   sourceType: z.string().optional(),
   sourceIdentifier: z.string().optional(),
   embedding: z.any().optional(),
   createdAt: z.date().or(z.string()),
   updatedAt: z.date().or(z.string()),
});

export type KnowledgeChunk = z.infer<typeof knowledgeChunkSchema>;

// Agent relations (moved from content-schema)
export const agentRelations = relations(agent, ({ one, many }) => ({
   // content and contentRequests will be imported from content-schema
   // and referenced here after circular dependency is resolved
   user: one(user, {
      fields: [agent.userId],
      references: [user.id],
   }),
   knowledgeChunks: many(knowledgeChunk),
}));

// KnowledgeChunk relations
export const knowledgeChunkRelations = relations(knowledgeChunk, ({ one }) => ({
   agent: one(agent, {
      fields: [knowledgeChunk.agentId],
      references: [agent.id],
   }),
}));
