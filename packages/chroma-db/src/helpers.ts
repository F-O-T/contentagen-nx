import type { Collection, Metadata, ChromaClient } from "chromadb";

export interface AddToCollectionArgs {
   ids: string[];
   embeddings?: number[][];
   documents?: string[];
   metadatas?: Metadata[];
   uris?: string[];
}

export interface QueryCollectionArgs {
   queryEmbeddings: number[][];
   queryTexts?: string[];
   nResults?: number;
}

export const createCollection = async (
   client: ChromaClient,
   opts: { name: string; metadata?: Metadata },
) => {
   return await client.createCollection(opts);
};

export const getCollection = async (client: ChromaClient, name: string) => {
   return await client.getCollection({ name });
};

export const listCollections = async (client: ChromaClient) => {
   const collections = await client.listCollections();
   return collections.map((c: { name: string }) => c.name);
};

export const deleteCollection = async (client: ChromaClient, name: string) => {
   await client.deleteCollection({ name });
};

export const addToCollection = async (
   collection: Collection,
   args: AddToCollectionArgs,
) => {
   await collection.add(args);
};

export const queryCollection = async (
   collection: Collection,
   args: QueryCollectionArgs,
) => {
   return await collection.query(args);
};

export function chunkText(
   text: string,
   maxChunkLength = 50000,
   overlap = 500,
): string[] {
   const chunks: string[] = [];
   let start = 0;
   while (start < text.length) {
      let end = start + maxChunkLength;
      if (end < text.length) {
         const lastSentence = text.lastIndexOf(".", end);
         const lastNewline = text.lastIndexOf("\n", end);
         const breakPoint = Math.max(lastSentence, lastNewline);
         if (breakPoint > start + maxChunkLength * 0.7) {
            end = breakPoint + 1;
         }
      }
      chunks.push(text.slice(start, end));
      start = end - overlap;
   }
   return chunks;
}
