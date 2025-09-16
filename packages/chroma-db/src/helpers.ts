import type { Collection, Metadata, ChromaClient } from "chromadb";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import { serverEnv } from "@packages/environment/server";
export const embedder = new OpenAIEmbeddingFunction({
   modelName: "text-embedding-3-small",
   apiKey: serverEnv.OPENAI_API_KEY,
});

export const CollectionName = {
   AgentKnowledge: "agent_knowledge",
   RelatedSlugs: "related_slugs",
   BrandKnowledge: "brand_knowledge",
   CompetitorKnowledge: "competitor_knowledge",
} as const;

export type CollectionName =
   (typeof CollectionName)[keyof typeof CollectionName];

export const ensureCollections = async (
   client: ChromaClient,
): Promise<Record<CollectionName, Collection>> => {
   const results = {} as Record<CollectionName, Collection>;
   for (const key in CollectionName) {
      const collectionName = CollectionName[key as keyof typeof CollectionName];
      try {
         // Try to get the collection first
         const collection = await client.getCollection({
            name: collectionName,
            embeddingFunction: embedder,
         });
         console.log(`✓ Collection '${collectionName}' already exists`);
         results[collectionName as CollectionName] = collection;
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
            console.log(
               `✓ Successfully created collection '${collectionName}'`,
            );
            results[collectionName as CollectionName] = collection;
         } catch (createError) {
            console.error(
               `✗ Failed to create collection '${collectionName}':`,
               createError,
            );
            throw createError;
         }
      }
   }
   return results;
};

export const getCollection = async (
   client: ChromaClient,
   name: keyof typeof CollectionName,
): Promise<Collection> => {
   const collectionName = CollectionName[name];
   try {
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
