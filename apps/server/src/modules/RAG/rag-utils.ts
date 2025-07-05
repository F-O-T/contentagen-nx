import { openai } from "@api/integrations/openai";

export const generateEmbedding = async (content: string): Promise<number[]> => {
   try {
      const response = await openai.embeddings.create({
         input: content,
         model: "text-embedding-3-small",
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
         throw new Error("No embedding returned from OpenAI");
      }

      return embedding;
   } catch (error) {
      console.error("Error generating content request embedding:", error);
      throw error;
   }
};
