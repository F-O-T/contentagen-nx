import OpenAI from "openai";
import { serverEnv } from "@packages/environment/server";
import { sql, cosineDistance } from "drizzle-orm";

const openai = new OpenAI({
   apiKey: serverEnv.OPENAI_API_KEY,
});

export interface EmbeddingOptions {
   model?: string;
   dimensions?: number;
}

export interface CreateEmbeddingResult {
   embedding: number[];
   tokenCount: number;
   model: string;
}

export const createEmbedding = async (
   text: string,
   options: EmbeddingOptions = {},
): Promise<CreateEmbeddingResult> => {
   const { model = "text-embedding-3-small", dimensions = 1536 } = options;

   try {
      const response = await openai.embeddings.create({
         model,
         input: text,
         dimensions,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
         throw new Error("Failed to create embedding: No embedding found");
      }
      const tokenCount = response.usage?.total_tokens || 0;

      return {
         embedding,
         tokenCount,
         model,
      };
   } catch (error) {
      throw new Error(
         `Failed to create embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
   }
};

export const createBatchEmbeddings = async (
   texts: string[],
   options: EmbeddingOptions = {},
): Promise<CreateEmbeddingResult[]> => {
   const { model = "text-embedding-3-small", dimensions = 1536 } = options;

   try {
      const response = await openai.embeddings.create({
         model,
         input: texts,
         dimensions,
      });

      return response.data.map((data) => ({
         embedding: data.embedding,
         tokenCount: response.usage?.total_tokens || 0,
         model,
      }));
   } catch (error) {
      throw new Error(
         `Failed to create batch embeddings: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
   }
};

export const cosineSimilarity = (
   embeddingColumn: any,
   queryVector: number[],
) => {
   return sql<number>`1 - (${cosineDistance(embeddingColumn, queryVector)})`;
};

