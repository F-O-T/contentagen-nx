import {
   pgTable,
   index,
   text,
   timestamp,
   uuid,
   vector,
} from "drizzle-orm/pg-core";

export const relatedSlugs = pgTable(
   "related_slugs",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      slug: text("slug").notNull(),
      embedding: vector("embedding", { dimensions: 1536 }).notNull(),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("relatedSlugsEmbeddingIndex").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
   ],
);

export type RelatedSlugs = typeof relatedSlugs.$inferSelect;
export type RelatedSlugsInsert = typeof relatedSlugs.$inferInsert;


