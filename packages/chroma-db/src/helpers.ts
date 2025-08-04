import type { Collection, Metadata, ChromaClient } from "chromadb";
import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";
export const embedder = new DefaultEmbeddingFunction();

// Collection names used in ChromaDB
export const CollectionName = {
   AgentKnowledge: "agent_knowledge",
   // Add more as needed
} as const;

export type CollectionName =
   (typeof CollectionName)[keyof typeof CollectionName];

/**
 * Get a collection by name, or create it if it doesn't exist.
 * Returns { collection, justCreated }
 */
export const getOrCreateCollection = async (
   client: ChromaClient,
   name: keyof typeof CollectionName,
   metadata?: Metadata,
): Promise<{ collection: Collection; justCreated: boolean }> => {
   const collectionName = CollectionName[name];
   try {
      const collection = await client.getCollection({
         name: collectionName,
         embeddingFunction: embedder,
      });
      return { collection, justCreated: false };
   } catch (err) {
      console.error(
         `Collection "${collectionName}" not found, creating a new one:`,
         err,
      );
      const collection = await client.createCollection({
         name: collectionName,
         embeddingFunction: embedder,

         metadata,
      });
      return { collection, justCreated: true };
   }
};
type AddToCollectionArgs = Parameters<Collection["add"]>[0];
type QueryCollectionArgs = Parameters<Collection["query"]>[0];

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

export const deleteFromCollection = async (
   collection: Collection,
   args: Parameters<Collection["delete"]>[0],
) => {
   await collection.delete(args);
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
