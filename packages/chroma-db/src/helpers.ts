import type { Collection, Metadata, ChromaClient } from "chromadb";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import { serverEnv } from "@packages/environment/server";
export const embedder = new OpenAIEmbeddingFunction({
   modelName: "text-embedding-3-small",
   apiKey: serverEnv.OPENAI_API_KEY,
});

// Collection names used in ChromaDB
export const CollectionName = {
   AgentKnowledge: "agent_knowledge",
   // Add more as needed
} as const;

export type CollectionName =
   (typeof CollectionName)[keyof typeof CollectionName];

/**
 * Test ChromaDB connection
 */
export const testConnection = async (
   client: ChromaClient,
): Promise<boolean> => {
   try {
      const heartbeat = await client.heartbeat();
      console.log(
         `ChromaDB connection test successful. Heartbeat: ${heartbeat}`,
      );

      const version = await client.version();
      console.log(`ChromaDB version: ${version}`);

      const collections = await client.listCollections();
      console.log(
         `Existing collections: ${collections.map((c) => c.name).join(", ") || "none"}`,
      );

      return true;
   } catch (error) {
      console.error(`ChromaDB connection test failed:`, error);
      return false;
   }
};

/**
 * Ensure the agent_knowledge collection exists, creating it if necessary
 */
export const ensureAgentKnowledgeCollection = async (
   client: ChromaClient,
): Promise<Collection> => {
   const collectionName = "agent_knowledge";

   try {
      // Try to get the collection first
      const collection = await client.getCollection({
         name: collectionName,
         embeddingFunction: embedder,
      });
      console.log(`✓ Collection '${collectionName}' already exists`);
      return collection;
   } catch {
      // Collection doesn't exist, create it
      console.log(
         `Creating collection '${collectionName}' with OpenAI embedding function...`,
      );
      try {
         const collection = await client.createCollection({
            name: collectionName,
            embeddingFunction: embedder,
         });
         console.log(`✓ Successfully created collection '${collectionName}'`);
         return collection;
      } catch (createError) {
         console.error(
            `✗ Failed to create collection '${collectionName}':`,
            createError,
         );
         throw createError;
      }
   }
};

/**
 * Get a collection by name. The collection should already exist since we create them during client initialization.
 */
export const getCollection = async (
   client: ChromaClient,
   name: keyof typeof CollectionName,
): Promise<Collection> => {
   const collectionName = CollectionName[name];
   try {
      console.log(`Getting collection: ${collectionName}`);
      const collection = await client.getCollection({
         name: collectionName,
         embeddingFunction: embedder,
      });
      console.log(`✓ Successfully retrieved collection: ${collectionName}`);
      return collection;
   } catch (err) {
      console.error(`✗ Failed to get collection "${collectionName}":`, err);
      throw err;
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
