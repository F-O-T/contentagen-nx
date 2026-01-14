/**
 * Content to be indexed in the RAG system
 */
export interface ContentToIndex {
   id: string; // content.id (externalId for vectors)
   writerId: string; // For filtering by agent
   slug: string;
   title: string;
   description: string;
   keywords?: string[];
   body: string;
}

/**
 * Result of indexing operation
 */
export interface IndexingResult {
   contentId: string;
   metadataIndexed: boolean;
   chunksIndexed: number;
}

/**
 * Metadata stored with content metadata vectors
 */
export interface ContentMetadata {
   externalId: string;
   writerId: string;
   slug: string;
   title: string;
   description: string;
   keywords?: string[];
   text: string;
   type: "metadata";
}

/**
 * Metadata stored with content chunk vectors
 */
export interface ContentChunkMetadata {
   externalId: string;
   writerId: string;
   chunkIndex: number;
   text: string;
   type: "chunk";
}

/**
 * Search result for related posts
 */
export interface RelatedPost {
   slug: string;
   title: string;
   description: string;
   relevance: string;
}

/**
 * Search result for content chunks
 */
export interface RelevantChunk {
   content: string;
   relevance: string;
}

/**
 * Search mode options
 */
export type SearchMode = "links" | "context" | "both";
