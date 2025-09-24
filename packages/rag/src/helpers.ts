import OpenAI from "openai";
import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";

const openai = new OpenAI({
   apiKey: serverEnv.OPENAI_API_KEY,
});

export const createEmbedding = async (text: string) => {
   try {
      const response = await openai.embeddings.create({
         model: "text-embedding-3-small",
         input: text,
         dimensions: 1536,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
         throw AppError.internal(
            "Failed to create embedding: No embedding found",
         );
      }
      const tokenCount = response.usage?.total_tokens || 0;

      return {
         embedding,
         tokenCount,
      };
   } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(
         `Failed to create embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
   }
};

export const createEmbeddings = async (
   texts: string[],
): Promise<number[][]> => {
   try {
      if (texts.length === 0) {
         return [];
      }

      if (texts.length === 1) {
         if (!texts[0]) {
            throw AppError.internal(
               "Failed to create embeddings: Missing text",
            );
         }
         const { embedding } = await createEmbedding(texts[0]);
         return [embedding];
      }

      const response = await openai.embeddings.create({
         model: "text-embedding-3-small",
         input: texts,
         dimensions: 1536,
      });

      const embeddings = response.data.map((item) => {
         if (!item.embedding) {
            throw AppError.internal(
               "Failed to create embeddings: Missing embedding in response",
            );
         }
         return item.embedding;
      });
      if (embeddings.length !== texts.length) {
         throw AppError.internal(
            "Failed to create embeddings: Mismatch in response length",
         );
      }

      return embeddings;
   } catch (error) {
      propagateError(error);
      throw AppError.internal(
         `Failed to create embeddings: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
   }
};
