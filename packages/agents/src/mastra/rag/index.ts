// RAG Service

// Content Indexer
export {
   batchIndexContent,
   indexContent,
   removeContent,
} from "./content-indexer";
export {
   CONTENT_CHUNKS_INDEX,
   CONTENT_METADATA_INDEX,
   EMBEDDING_DIMENSION,
   embeddingModel,
   initializeRagService,
   isRagAvailable,
   ragService,
   type SimilarContentResult,
   searchSimilarContent,
} from "./rag-service";

// Types
export type {
   ContentChunkMetadata,
   ContentMetadata,
   ContentToIndex,
   IndexingResult,
   RelatedPost,
   RelevantChunk,
   SearchMode,
} from "./types";
