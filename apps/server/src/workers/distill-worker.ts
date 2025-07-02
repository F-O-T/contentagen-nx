import { Queue, Worker, type Job } from "bullmq";
import { openRouter } from "../integrations/openrouter";
import { redis } from "../services/redis";
import { embeddingService } from "../services/embedding";
import { knowledgeChunkQueue } from "./knowledge-chunk-worker";

// Enhanced type definitions
export type KnowledgePoint = {
   summary: string;
   category?: string;
   keywords?: string[];
   source?: string;
   source_type?: string;
   source_identifier?: string;
   content: string;
   confidence?: number; // Add confidence scoring
};

export type DistillJobData = {
   agentId: string;
   rawText: string;
   source: string;
   sourceType: string;
   sourceIdentifier: string;
   options?: {
      chunkSize?: number;
      overlapSize?: number;
      minContentLength?: number;
      maxRetries?: number;
   };
};

// Enhanced configuration
const DISTILL_CONFIG = {
   MODEL: "qwen/qwen3-30b-a3b-04-28",
   MAX_TEXT_LENGTH: 50000, // Prevent context overflow
   MIN_CONTENT_LENGTH: 50, // Skip trivial content
   MAX_CHUNKS_PER_BATCH: 10, // Process in batches
   EMBEDDING_BATCH_SIZE: 5, // Batch embedding generation
   RETRY_ATTEMPTS: 3,
   RETRY_DELAY: 1000, // ms
} as const;

// Enhanced prompt building with better instructions
function buildExtractionPrompt(rawText: string, sourceType: string): string {
   return `You are the Synthesizer Agent. Extract valuable, actionable KnowledgePoints from the provided text.

QUALITY CRITERIA:
- Each KnowledgePoint must be self-contained and meaningful
- Minimum ${DISTILL_CONFIG.MIN_CONTENT_LENGTH} characters of substantial content
- Focus on actionable insights, not generic statements
- Include context and practical implications
- Avoid redundancy between points

OUTPUT FORMAT (one per line):
1. [CONTENT]: Deep synthesis with context and implications
   [SUMMARY]: 1-2 sentence core insight

EXAMPLE:
1. When implementing authentication flows, always validate tokens on both client and server sides to prevent security vulnerabilities. Client-side validation provides immediate feedback while server-side validation ensures data integrity and prevents tampering.
   Authentication requires dual-layer token validation for optimal security and user experience.

Raw Input (${rawText.length} chars):
"""${rawText.slice(0, DISTILL_CONFIG.MAX_TEXT_LENGTH)}"""
Source: ${sourceType}
`;
}

function buildFormattingPrompt(extractedChunks: string): string {
   return `Transform these KnowledgePoints into structured JSON objects. Each object needs:

REQUIRED FIELDS:
- content: The full synthesis text
- summary: The core insight
- category: One of 'brand_guideline', 'product_spec', 'market_insight', 'technical_instruction', or 'custom'
- keywords: 3-5 specific, actionable terms (avoid generic words)
- source: The source type provided
- confidence: Float 0-1 indicating extraction quality

STRICT REQUIREMENTS:
- Output ONLY a JSON array: [{ ... }, { ... }]
- No markdown, no explanations, no code fences
- Valid JSON parseable by JSON.parse()
- Even single items must be in an array

QUALITY FILTERS:
- Exclude generic or trivial content
- Ensure keywords are specific and valuable
- Set confidence based on content specificity and actionability

KnowledgePoints:
"""${extractedChunks}"""
`;
}

// Enhanced text chunking for large inputs
function chunkText(
   text: string,
   maxLength: number = DISTILL_CONFIG.MAX_TEXT_LENGTH,
   overlap: number = 500,
): string[] {
   if (text.length <= maxLength) return [text];

   const chunks: string[] = [];
   let start = 0;

   while (start < text.length) {
      let end = start + maxLength;

      // Try to break at sentence boundaries
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

// Enhanced extraction with retry logic
async function runStep1Extraction(
   rawText: string,
   sourceType: string,
   job: Job,
): Promise<string> {
   const chunks = chunkText(rawText);
   job.log(`Processing ${chunks.length} text chunks`);

   const extractedChunks: string[] = [];

   for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i] ?? "";
      job.updateProgress(Math.round((i / chunks.length) * 50)); // First 50% of progress

      let attempt = 0;
      while (attempt < DISTILL_CONFIG.RETRY_ATTEMPTS) {
         try {
            const prompt = buildExtractionPrompt(chunk, sourceType);
            const response = await openRouter.chat.completions.create({
               model: DISTILL_CONFIG.MODEL,
               messages: [{ role: "user", content: prompt }],
               response_format: { type: "text" },
               temperature: 0.3, // More consistent results
               max_tokens: 2000,
            });

            const extracted = response.choices[0]?.message?.content?.trim();
            if (
               !extracted ||
               extracted.length < DISTILL_CONFIG.MIN_CONTENT_LENGTH
            ) {
               throw new Error(
                  `Insufficient extraction output: ${extracted?.length || 0} chars`,
               );
            }

            extractedChunks.push(extracted);
            job.log(
               `Extracted ${extracted.length} chars from chunk ${i + 1}/${chunks.length}`,
            );
            break;
         } catch (error) {
            attempt++;
            job.log(
               `Extraction attempt ${attempt} failed for chunk ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
            );

            if (attempt >= DISTILL_CONFIG.RETRY_ATTEMPTS) {
               job.log(`Skipping chunk ${i + 1} after ${attempt} attempts`);
               break;
            }

            await new Promise((resolve) =>
               setTimeout(resolve, DISTILL_CONFIG.RETRY_DELAY * attempt),
            );
         }
      }
   }

   if (extractedChunks.length === 0) {
      throw new Error("No content could be extracted from any chunks");
   }

   return extractedChunks.join("\n\n");
}

// Enhanced formatting with better error handling
async function runStep2Formatting(
   extractedChunks: string,
   job: Job,
): Promise<KnowledgePoint[]> {
   let attempt = 0;

   while (attempt < DISTILL_CONFIG.RETRY_ATTEMPTS) {
      try {
         const prompt = buildFormattingPrompt(extractedChunks);
         const response = await openRouter.chat.completions.create({
            model: DISTILL_CONFIG.MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.1, // Very consistent for JSON output
            max_tokens: 3000,
         });

         const generated = response.choices[0]?.message?.content;
         if (!generated) {
            throw new Error("No formatting output from model");
         }

         job.log(`Raw formatting output: ${generated.length} chars`);

         // Enhanced JSON parsing with multiple fallback strategies
         const result = parseJSONWithFallbacks(generated);

         // Validate and filter results
         const validatedResults = validateKnowledgePoints(result, job);

         if (validatedResults.length === 0) {
            throw new Error("No valid knowledge points after filtering");
         }

         job.log(
            `Successfully formatted ${validatedResults.length} knowledge points`,
         );
         return validatedResults;
      } catch (error) {
         attempt++;
         job.log(
            `Formatting attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`,
         );

         if (attempt >= DISTILL_CONFIG.RETRY_ATTEMPTS) {
            throw new Error(
               `Failed to format after ${attempt} attempts: ${error instanceof Error ? error.message : String(error)}`,
            );
         }

         await new Promise((resolve) =>
            setTimeout(resolve, DISTILL_CONFIG.RETRY_DELAY * attempt),
         );
      }
   }

   throw new Error("Formatting failed after all attempts");
}

// Enhanced JSON parsing with multiple fallback strategies
function parseJSONWithFallbacks(jsonString: string) {
   const strategies = [
      (str: string) => JSON.parse(str), // Direct parse
      (str: string) => JSON.parse(str.replace(/^[^{[]+/, "")), // Remove prefix
      (str: string) => JSON.parse(str.replace(/,[\s\n\r]*([\]}])/g, "$1")), // Remove trailing commas
      (str: string) => JSON.parse(str.replace(/'/g, '"')), // Fix quotes
      (str: string) => {
         // Extract JSON from markdown or text blocks
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

// Validate and filter knowledge points
function validateKnowledgePoints(result: unknown, job: Job): KnowledgePoint[] {
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

   // Filter and validate points
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

      // Set default confidence if not provided
      if (typeof point.confidence !== "number") {
         point.confidence = calculateConfidence(point);
      }

      // Filter low-confidence points
      if (point.confidence < 0.3) {
         job.log(`Skipping low-confidence point: ${point.confidence}`);
         return false;
      }

      return true;
   });

   return validPoints;
}

// Calculate confidence score based on content quality
function calculateConfidence(point: KnowledgePoint): number {
   let confidence = 0.5; // Base confidence

   // Content length factor
   if (point.content.length > 200) confidence += 0.2;
   if (point.content.length > 500) confidence += 0.1;

   // Keywords quality
   if (point.keywords && point.keywords.length >= 3) confidence += 0.1;

   // Category specificity
   if (point.category && point.category !== "custom") confidence += 0.1;

   // Content specificity indicators
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

// Batch embedding generation for better performance
async function generateEmbeddingsBatch(
   contents: string[],
   job: Job,
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

// Main distillation function with comprehensive error handling
async function generateDistilledKnowledge(
   rawText: string,
   sourceType: string,
   job: Job,
): Promise<KnowledgePoint[]> {
   try {
      // Step 1: Extract knowledge points
      job.log("Starting knowledge extraction...");
      const extracted = await runStep1Extraction(rawText, sourceType, job);

      // Step 2: Format into structured objects
      job.log("Starting knowledge formatting...");
      job.updateProgress(60);
      const formatted = await runStep2Formatting(extracted, job);

      job.updateProgress(80);
      job.log(`Successfully distilled ${formatted.length} knowledge points`);

      return formatted;
   } catch (error) {
      job.log(
         `Distillation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
   }
}

// Enhanced queue configuration
export const distillQueue = new Queue("distill-knowledge", {
   connection: redis,
   defaultJobOptions: {
      removeOnComplete: 10, // Keep last 10 completed jobs
      removeOnFail: 25, // Keep last 25 failed jobs for debugging
      attempts: 3,
      backoff: {
         type: "exponential",
         delay: 2000,
      },
   },
});

distillQueue.on("error", (err) => {
   console.error("Distill queue error:", err);
});

// Enhanced worker with better job processing
export const distillWorker = new Worker(
   "distill-knowledge",
   async (job: Job<DistillJobData>) => {
      const { agentId, rawText, source, sourceType, sourceIdentifier } =
         job.data;

      job.log(`Starting distillation for agent: ${agentId}`);
      job.log(`Input text: ${rawText.length} characters`);
      job.updateProgress(0);

      try {
         // Validate input
         if (!rawText.trim()) {
            throw new Error("Empty input text provided");
         }

         if (rawText.length < DISTILL_CONFIG.MIN_CONTENT_LENGTH) {
            throw new Error(`Input text too short: ${rawText.length} chars`);
         }

         // Run distillation
         const knowledgePoints = await generateDistilledKnowledge(
            rawText,
            sourceType,
            job,
         );
         job.updateProgress(85);

         if (knowledgePoints.length === 0) {
            throw new Error("No knowledge points extracted");
         }

         job.log(
            `Processing ${knowledgePoints.length} knowledge points for database insertion`,
         );

         // Generate embeddings in batches
         const contents = knowledgePoints.map((kp) => kp.content);
         const embeddings = await generateEmbeddingsBatch(contents, job);
         job.updateProgress(95);

         // Save to database with transaction
         // Enqueue jobs to the knowledge chunk queue instead of direct DB insert
         for (const [i, kp] of knowledgePoints.entries()) {
            const embedding = embeddings[i] || [];
            await knowledgeChunkQueue.add("create", {
               action: "create",
               agentId,
               content: kp.content,
               summary: kp.summary,
               category: kp.category,
               keywords: kp.keywords,
               source: kp.source || source,
               sourceType: kp.source_type || sourceType,
               sourceIdentifier: kp.source_identifier || sourceIdentifier,
               embedding,
            });
         }

         job.updateProgress(100);
         job.log(
            `Enqueued ${knowledgePoints.length} knowledge chunk jobs to the queue`,
         );

         return {
            success: true,
            agentId,
            totalExtracted: knowledgePoints.length,
            inputLength: rawText.length,
            averageConfidence:
               knowledgePoints.reduce(
                  (sum, kp) => sum + (kp.confidence || 0.5),
                  0,
               ) / knowledgePoints.length,
         };
      } catch (error) {
         const errorMsg = `Distillation failed for agent ${agentId}`;
         const fullError =
            error instanceof Error ? error.message : String(error);

         job.log(`ERROR: ${errorMsg} - ${fullError}`);

         throw new Error(`${errorMsg}: ${fullError}`);
      }
   },
   {
      connection: redis,
      concurrency: 5, // Reduced for better resource management
      limiter: {
         max: 10, // Max 10 jobs per interval
         duration: 60000, // 1 minute
      },
   },
);

// Enhanced error handling and logging
distillWorker.on("error", (err) => {
   console.error("Distill worker error:", err);
});

distillWorker.on("failed", (job, err) => {
   console.error(`Job ${job?.id} failed:`, err);
});

distillWorker.on("completed", (job, result) => {
   console.log(`Job ${job.id} completed:`, result);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
   console.log(`Received ${signal}, closing distill worker...`);

   try {
      await distillWorker.close();
      await distillQueue.close();
      console.log("Distill worker closed gracefully");
   } catch (error) {
      console.error("Error during shutdown:", error);
   }

   process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Export utility functions for testing
export {
   generateDistilledKnowledge,
   chunkText,
   validateKnowledgePoints,
   calculateConfidence,
   DISTILL_CONFIG,
};
