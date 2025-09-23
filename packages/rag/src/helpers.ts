import OpenAI from "openai";
import { serverEnv } from "@packages/environment/server";

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
         throw new Error("Failed to create embedding: No embedding found");
      }
      const tokenCount = response.usage?.total_tokens || 0;

      return {
         embedding,
         tokenCount,
      };
   } catch (error) {
      throw new Error(
         `Failed to create embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
   }
};
