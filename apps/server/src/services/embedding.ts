import { openai } from "@api/integrations/openai";

type SimilarityCategory = "success" | "info" | "warning" | "error";

type SimilarityCategorization = {
  category: SimilarityCategory;
  message: string;
};

const generateContentRequestEmbedding = async (topic: string, briefDescription: string): Promise<number[]> => {
  const text = `Topic: ${topic}\nDescription: ${briefDescription}`;
  
  try {
    const response = await openai.embeddings.create({
      input: text,
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

const generateContentEmbedding = async (title: string, body: string): Promise<number[]> => {
  const text = `Title: ${title}\nContent: ${body}`;
  
  try {
    const response = await openai.embeddings.create({
      input: text,
      model: "text-embedding-3-small",
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error("No embedding returned from OpenAI");
    }

    return embedding;
  } catch (error) {
    console.error("Error generating content embedding:", error);
    throw error;
  }
};

const calculateCosineSimilarity = (embedding1: number[], embedding2: number[]): number => {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    const val1 = embedding1[i] ?? 0;
    const val2 = embedding2[i] ?? 0;
    
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  }

  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
};

const categorizeSimilarity = (similarity: number): SimilarityCategorization => {
  if (similarity >= 0.9) {
    return {
      category: "error",
      message: "Very high similarity detected - potential duplicate content",
    };
  } else if (similarity >= 0.7) {
    return {
      category: "warning",
      message: "High similarity detected - review for originality",
    };
  } else if (similarity >= 0.5) {
    return {
      category: "info",
      message: "Moderate similarity detected - consider differentiation",
    };
  } else {
    return {
      category: "success",
      message: "Low similarity - content appears unique",
    };
  }
};

// Initialize embedding service with OpenAI provider
const embeddingService = {
  generateContentRequestEmbedding,
  generateContentEmbedding,
};

export { 
  calculateCosineSimilarity,
  categorizeSimilarity,
  embeddingService 
};
