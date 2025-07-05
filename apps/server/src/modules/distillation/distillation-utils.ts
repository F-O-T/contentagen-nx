// Type for a distilled knowledge point
export interface KnowledgePoint {
   content: string;
   summary: string;
   keywords?: string[];
   category?: string;
   confidence?: number;
   source?: string;
}

// Minimal context for distillation jobs (for logging)
export interface DistillationJobContext {
   log: (msg: string) => void;
}

// Prompts, chunking, parsing, validation, and embedding helpers for distillation
import { embeddingService } from "../../services/embedding";

export const DISTILL_CONFIG = {
   MODEL: "google/gemini-2.0-flash-001",
   MAX_TEXT_LENGTH: 50000,
   MIN_CONTENT_LENGTH: 50,
   MAX_CHUNKS_PER_BATCH: 10,
   EMBEDDING_BATCH_SIZE: 5,
   RETRY_ATTEMPTS: 3,
   RETRY_DELAY: 1000,
} as const;

export function chunkText(
   text: string,
   maxLength: number = DISTILL_CONFIG.MAX_TEXT_LENGTH,
   overlap: number = 500,
): string[] {
   if (text.length <= maxLength) return [text];
   const chunks: string[] = [];
   let start = 0;
   while (start < text.length) {
      let end = start + maxLength;
      if (end < text.length) {
         const lastSentence = text.lastIndexOf(".", end);
         const lastNewline = text.lastIndexOf("\n", end);
         const breakPoint = Math.max(lastSentence, lastNewline);
         if (breakPoint > start + maxLength * 0.7) {
            end = breakPoint + 1;
         }
      }
      chunks.push(text.slice(start, end));
      start = end - overlap;
   }
   return chunks;
}

export function parseJSONWithFallbacks(jsonString: string) {
   const strategies = [
      (str: string) => JSON.parse(str),
      (str: string) => JSON.parse(str.replace(/^[^{[]+/, "")),
      (str: string) => JSON.parse(str.replace(/,[\s\n\r]*([\]}])/g, "$1")),
      (str: string) => JSON.parse(str.replace(/'/g, '"')),
      (str: string) => {
         const match =
            str.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/) ||
            str.match(/(\[[\s\S]*?\]|\{[\s\S]*?\})/);
         return match ? JSON.parse(match[1] ?? "") : null;
      },
   ];
   for (const strategy of strategies) {
      try {
         const result = strategy(jsonString);
         if (result) return result;
      } catch {}
   }
   throw new Error("All JSON parsing strategies failed");
}

export function validateKnowledgePoints(
   result: unknown,
   job: DistillationJobContext,
): KnowledgePoint[] {
   let points: KnowledgePoint[] = [];
   if (Array.isArray(result)) {
      points = result as KnowledgePoint[];
   } else if (
      typeof result === "object" &&
      result !== null &&
      "content" in result &&
      "summary" in result
   ) {
      points = [result as KnowledgePoint];
   } else {
      throw new Error(
         "Invalid result format - expected array or object with content and summary",
      );
   }
   const validPoints = points.filter((point) => {
      if (!point.content || !point.summary) {
         job.log(`Skipping point with missing content/summary`);
         return false;
      }
      if (point.content.length < DISTILL_CONFIG.MIN_CONTENT_LENGTH) {
         job.log(
            `Skipping point with insufficient content: ${point.content.length} chars`,
         );
         return false;
      }
      if (typeof point.confidence !== "number") {
         point.confidence = calculateConfidence(point);
      }
      if (point.confidence < 0.3) {
         job.log(`Skipping low-confidence point: ${point.confidence}`);
         return false;
      }
      return true;
   });
   return validPoints;
}

export function calculateConfidence(point: KnowledgePoint): number {
   let confidence = 0.5;
   if (point.content.length > 200) confidence += 0.2;
   if (point.content.length > 500) confidence += 0.1;
   if (point.keywords && point.keywords.length >= 3) confidence += 0.1;
   if (point.category && point.category !== "custom") confidence += 0.1;
   const specificityIndicators = [
      /\b(steps?|process|method|approach|technique|strategy)\b/i,
      /\b(example|instance|case|scenario)\b/i,
      /\b(should|must|need|require|essential)\b/i,
      /\b(implementation|integration|configuration)\b/i,
   ];
   const matches = specificityIndicators.filter((regex) =>
      regex.test(point.content),
   ).length;
   confidence += matches * 0.05;
   return Math.min(confidence, 1.0);
}

export async function generateEmbeddingsBatch(
   contents: string[],
   job: DistillationJobContext,
): Promise<(number[] | null)[]> {
   const embeddings: (number[] | null)[] = [];
   for (
      let i = 0;
      i < contents.length;
      i += DISTILL_CONFIG.EMBEDDING_BATCH_SIZE
   ) {
      const batch = contents.slice(i, i + DISTILL_CONFIG.EMBEDDING_BATCH_SIZE);
      job.log(
         `Generating embeddings for batch ${Math.floor(i / DISTILL_CONFIG.EMBEDDING_BATCH_SIZE) + 1}`,
      );
      const batchPromises = batch.map(async (content) => {
         try {
            return await embeddingService.generateFileContentEmbedding(content);
         } catch (error) {
            job.log(
               `Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`,
            );
            return null;
         }
      });
      const batchResults = await Promise.all(batchPromises);
      embeddings.push(...batchResults);
   }
   return embeddings;
}
