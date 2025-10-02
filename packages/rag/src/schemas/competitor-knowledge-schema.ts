import {
   pgTable,
   index,
   text,
   timestamp,
   uuid,
   vector,
   pgEnum,
} from "drizzle-orm/pg-core";

export const competitorKnowledgeType = pgEnum("competitor_knowledge_type", [
   "feature",
   "document",
]);
export const competitorKnowledge = pgTable(
   "competitor_knowledge",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      externalId: uuid("external_id").notNull(),
      sourceId: text("source_id").notNull(),
      chunk: text("chunk").notNull(),
      type: competitorKnowledgeType("knowledge_type").notNull(),
      embedding: vector("embedding", { dimensions: 1536 }).notNull(),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("competitorKnowledgeEmbeddingIndex").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
   ],
);

export type CompetitorKnowledgeSelect = typeof competitorKnowledge.$inferSelect;
export type CompetitorKnowledgeInsert = typeof competitorKnowledge.$inferInsert;
export type CompetitorKnowledgeType =
   (typeof competitorKnowledgeType.enumValues)[number];
