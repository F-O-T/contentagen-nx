import {
   index,
   integer,
   pgTable,
   text,
   timestamp,
   uuid,
   vector,
} from "drizzle-orm/pg-core";

/**
 * Content Metadata RAG
 *
 * Stores embeddings for content metadata (title, description, keywords)
 * Used for topic-level matching and internal linking suggestions
 */
export const contentMetadataRag = pgTable(
   "content_metadata_rag",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      externalId: uuid("external_id").notNull(), // content.id
      agentId: uuid("agent_id").notNull(),
      slug: text("slug").notNull(),
      title: text("title").notNull(),
      description: text("description").notNull(),
      keywords: text("keywords").array(), // stored as array for reference
      embedding: vector("embedding", { dimensions: 1536 }).notNull(),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("contentMetadataRagEmbeddingIndex").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
      index("contentMetadataRagAgentIdIndex").on(table.agentId),
      index("contentMetadataRagExternalIdIndex").on(table.externalId),
   ],
);

export type ContentMetadataRag = typeof contentMetadataRag.$inferSelect;
export type ContentMetadataRagInsert = typeof contentMetadataRag.$inferInsert;

/**
 * Content Chunks RAG
 *
 * Stores embeddings for chunked content body
 * Used for detailed context retrieval and consistency checking
 */
export const contentChunksRag = pgTable(
   "content_chunks_rag",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      externalId: uuid("external_id").notNull(), // content.id
      agentId: uuid("agent_id").notNull(),
      chunkIndex: integer("chunk_index").notNull(),
      chunk: text("chunk").notNull(),
      embedding: vector("embedding", { dimensions: 1536 }).notNull(),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [
      index("contentChunksRagEmbeddingIndex").using(
         "hnsw",
         table.embedding.op("vector_cosine_ops"),
      ),
      index("contentChunksRagAgentIdIndex").on(table.agentId),
      index("contentChunksRagExternalIdIndex").on(table.externalId),
   ],
);

export type ContentChunksRag = typeof contentChunksRag.$inferSelect;
export type ContentChunksRagInsert = typeof contentChunksRag.$inferInsert;
