/**
 * Embedding Service
 * Handles text embedding generation using OpenAI
 * Functional approach without classes
 */

// Types
type EmbeddingProvider = (text: string) => Promise<number[]>;

type SimilarityCategory = "success" | "info" | "warning" | "error";

type SimilarityCategorization = {
  category: SimilarityCategory;
  message: string;
};

// OpenAI Embedding Provider
const createOpenAIEmbeddingProvider = (apiKey: string, model: string = "text-embedding-3-small"): EmbeddingProvider => {
  return async (text: string): Promise<number[]> => {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          model: model,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error("Error generating OpenAI embedding:", error);
      throw error;
    }
  };
};

// Core embedding functions
const generateContentRequestEmbedding = (provider: EmbeddingProvider) => async (topic: string, briefDescription: string): Promise<number[]> => {
  const text = `Topic: ${topic}\nDescription: ${briefDescription}`;
  return provider(text);
};

const generateContentEmbedding = (provider: EmbeddingProvider) => async (title: string, body: string): Promise<number[]> => {
  const text = `Title: ${title}\nContent: ${body}`;
  return provider(text);
};

// Utility functions
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

// Create embedding service with a provider
const createEmbeddingService = (provider: EmbeddingProvider) => ({
  generateContentRequestEmbedding: generateContentRequestEmbedding(provider),
  generateContentEmbedding: generateContentEmbedding(provider),
  calculateCosineSimilarity,
  categorizeSimilarity,
});

// Determine which provider to use based on environment variables
const getEmbeddingProvider = (): EmbeddingProvider => {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (openaiKey) {
    console.log("Using OpenAI embedding provider");
    return createOpenAIEmbeddingProvider(openaiKey);
  } else {
    throw new Error("No embedding provider configured. Please set OPENAI_API_KEY environment variable.");
  }
};

// Initialize embedding service with the appropriate provider
const embeddingService = createEmbeddingService(getEmbeddingProvider());

export { 
  createEmbeddingService,
  createOpenAIEmbeddingProvider,
  calculateCosineSimilarity,
  categorizeSimilarity,
  embeddingService 
};
