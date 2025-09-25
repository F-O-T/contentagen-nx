import {
   pgTable,
   index,
   text,
   timestamp,
   uuid,
   vector,
   pgEnum,
} from "drizzle-orm/pg-core";

export const brandKnowledgeType = pgEnum("brand_knowledge_type", [
   "feature",
   "document",
]);
export const brandKnowledge = pgTable(
   "brand_knowledge",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      externalId: uuid("external_id").notNull(),
      sourceId: text("source_id").notNull(),
      chunk: text("chunk").notNull(),
      type: brandKnowledgeType("type").notNull(),
      embedding: vector("embedding", { dimensions: 1536 }).notNull(),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("brandKnowledgeEmbeddingIndex").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
   ],
);
export type BrandKnowledge = typeof brandKnowledge.$inferSelect;
export type BrandKnowledgeInsert = typeof brandKnowledge.$inferInsert;
export type BrandKnowledgeType = (typeof brandKnowledgeType.enumValues)[number];
