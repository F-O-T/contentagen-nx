import OpenAI from "openai";
import { serverEnv } from "@packages/environment/server";
import { AppError } from "@packages/utils/errors";

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
         throw AppError.internal("Failed to create embedding: No embedding found");
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
