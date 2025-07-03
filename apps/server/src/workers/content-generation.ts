import { env } from "@api/config/env";
import { auth } from "@api/integrations/auth";
import { knowledgeChunk } from "@api/schemas/agent-schema";
import { Job, Queue, Worker } from "bullmq";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../integrations/database";
import { openRouter } from "../integrations/openrouter";
import { content, contentRequest, type agent } from "../schemas/content-schema";
import {
   generateAgentPrompt,
   type AgentPromptOptions,
} from "../services/agent-prompt";
import { embeddingService } from "../services/embedding";
import { redis } from "../services/redis";

// Enhanced types
export type ContentRequestWithAgent = typeof contentRequest.$inferSelect & {
   agent: typeof agent.$inferSelect;
};

export type ContentGenerationJobData = {
   requestId: string;
   options?: {
      maxRetries?: number;
      includeKnowledgeBase?: boolean;
      maxKnowledgeChunks?: number;
      maxSimilarContent?: number;
      customPromptInstructions?: string;
   };
};

export type GeneratedContentResult = {
   content: string;
   metadata: ContentQualityMetrics & {
      topics?: string[];
      confidence?: number;
   };
};

// Content quality metrics
type ContentQualityMetrics = {
   wordCount: number;
   readingTime: number;
   paragraphCount: number;
   sentenceCount: number;
   avgWordsPerSentence: number;
   readabilityScore: number;
};

// Enhanced configuration
const CONTENT_CONFIG = {
   MODEL: "qwen/qwen3-30b-a3b-04-28",
   RETRY_ATTEMPTS: 3,
   RETRY_DELAY: 1000, // ms
   MAX_KNOWLEDGE_CHUNKS: 5,
   MAX_SIMILAR_CONTENT: 3,
   MIN_CONTENT_LENGTH: 100,
   MAX_CONTENT_LENGTH: 50000,
   WORDS_PER_MINUTE: 200, // Reading speed
   EMBEDDING_SIMILARITY_THRESHOLD: 0.7,
   CONTENT_GENERATION_TIMEOUT: 120000, // 2 minutes
} as const;

// Utility functions
function slugify(text: string): string {
   return text
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "")
      .substring(0, 100); // Limit slug length
}

function calculateContentMetrics(text: string): ContentQualityMetrics {
   if (!text || typeof text !== "string") {
      return {
         wordCount: 0,
         readingTime: 0,
         paragraphCount: 0,
         sentenceCount: 0,
         avgWordsPerSentence: 0,
         readabilityScore: 0,
      };
   }

   const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
   const wordCount = words.length;
   const readingTime = Math.ceil(wordCount / CONTENT_CONFIG.WORDS_PER_MINUTE);

   const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
   const paragraphCount = paragraphs.length;

   const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
   const sentenceCount = sentences.length;

   const avgWordsPerSentence =
      sentenceCount > 0 ? wordCount / sentenceCount : 0;

   // Simple readability score (Flesch-like approximation)
   const avgSentenceLength = avgWordsPerSentence;
   const avgSyllablesPerWord =
      words.reduce((sum, word) => {
         return (
            sum +
            Math.max(1, word.toLowerCase().replace(/[^aeiou]/g, "").length)
         );
      }, 0) / wordCount;

   const readabilityScore = Math.max(
      0,
      206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord,
   );

   return {
      wordCount,
      readingTime,
      paragraphCount,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
      readabilityScore: Math.round(readabilityScore * 100) / 100,
   };
}

// Enhanced RAG retrieval with proper vector similarity
async function retrieveRelevantKnowledge(
   agentId: string,
   topic: string,
   briefDescription: string,
   job: Job,
   options: ContentGenerationJobData["options"] = {},
): Promise<{
   knowledgeText?: string;
   usedSources: string[];
}> {
   const maxKnowledgeChunks =
      options.maxKnowledgeChunks || CONTENT_CONFIG.MAX_KNOWLEDGE_CHUNKS;

   let knowledgeText: string | undefined;
   const usedSources: string[] = [];

   try {
      job.log("Generating query embedding for knowledge retrieval...");

      // Create a comprehensive query string
      const queryText = `${topic}. ${briefDescription || ""}`.trim();
      const queryEmbedding =
         await embeddingService.generateFileContentEmbedding(queryText);

      if (!queryEmbedding) {
         throw new Error("Failed to generate query embedding");
      }

      // Retrieve relevant knowledge chunks with vector similarity
      job.log(
         `Searching for relevant knowledge chunks (limit: ${maxKnowledgeChunks})...`,
      );

      const relevantKnowledge = await db
         .select({
            id: knowledgeChunk.id,
            content: knowledgeChunk.content,
            summary: knowledgeChunk.summary,
            category: knowledgeChunk.category,
            keywords: knowledgeChunk.keywords,
            source: knowledgeChunk.source,
            embedding: knowledgeChunk.embedding,
         })
         .from(knowledgeChunk)
         .where(
            and(
               eq(knowledgeChunk.agentId, agentId),
               isNotNull(knowledgeChunk.embedding),
               eq(knowledgeChunk.isActive, true),
            ),
         )
         .orderBy(sql`embedding <-> ${JSON.stringify(queryEmbedding)}::vector`)
         .limit(maxKnowledgeChunks);

      if (relevantKnowledge.length > 0) {
         knowledgeText = relevantKnowledge
            .map(
               (chunk, idx) =>
                  `Knowledge Source ${idx + 1} (${chunk.category || "general"}):\n` +
                  `Summary: ${chunk.summary || "N/A"}\n` +
                  `Content: ${chunk.content}\n` +
                  `Keywords: ${chunk.keywords ? chunk.keywords.join(", ") : "N/A"}\n`,
            )
            .join("\n---\n\n");

         usedSources.push(
            ...relevantKnowledge
               .map((k) => k.source || "knowledge_base")
               .filter(Boolean),
         );
         job.log(
            `Retrieved ${relevantKnowledge.length} relevant knowledge chunks`,
         );
      }
   } catch (error) {
      job.log(
         `Knowledge retrieval failed: ${error instanceof Error ? error.message : String(error)}`,
      );
   }

   return { knowledgeText, usedSources };
}

// Enhanced content generation with better error handling
async function generateContent(
   prompt: string,
   job: Job,
   attempt: number = 1,
): Promise<GeneratedContentResult> {
   const maxAttempts = CONTENT_CONFIG.RETRY_ATTEMPTS;

   try {
      job.log(`Content generation attempt ${attempt}/${maxAttempts}`);

      const response = (await Promise.race([
         openRouter.chat.completions.create({
            model: CONTENT_CONFIG.MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.7, // Balance creativity with consistency
            max_tokens: 4000,
         }),
         new Promise((_, reject) =>
            setTimeout(
               () => reject(new Error("Content generation timeout")),
               CONTENT_CONFIG.CONTENT_GENERATION_TIMEOUT,
            ),
         ),
      ])) as {
         choices: Array<{
            message: { content: string };
         }>;
      };

      const generatedText = response.choices[0]?.message?.content;
      console.log(generatedText);
      if (!generatedText) {
         throw new Error("Empty response from content generation model");
      }

      // Enhanced JSON parsing with multiple strategies
      let result: { content: string; confidence?: number; topics?: string[] };
      try {
         result = JSON.parse(generatedText);
      } catch {
         // Try to extract JSON from potential markdown or text wrapping
         const jsonMatch =
            generatedText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) ||
            generatedText.match(/({[\s\S]*})/);
         if (jsonMatch && typeof jsonMatch[1] === "string") {
            result = JSON.parse(jsonMatch[1]);
         } else {
            throw new Error("Could not parse JSON from AI response");
         }
      }

      // Validate and extract content
      if (typeof result.content !== "string" || !result.content.trim()) {
         throw new Error("AI response does not contain valid content string");
      }

      const contentText = result.content.trim();

      // Content quality validation
      if (contentText.length < CONTENT_CONFIG.MIN_CONTENT_LENGTH) {
         throw new Error(
            `Generated content too short: ${contentText.length} characters`,
         );
      }

      if (contentText.length > CONTENT_CONFIG.MAX_CONTENT_LENGTH) {
         job.log(
            `Warning: Generated content is very long (${contentText.length} chars), truncating...`,
         );
         // Could implement smart truncation here
      }

      // Calculate content metrics
      const metrics = calculateContentMetrics(contentText);

      job.log(
         `Generated content: ${metrics.wordCount} words, ${metrics.readingTime} min read time`,
      );

      return {
         content: contentText,
         metadata: {
            ...metrics,
            confidence: result.confidence || 0.8, // Default confidence
            topics: result.topics || [],
         },
      };
   } catch (error) {
      const errorMsg = `Content generation attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`;
      job.log(errorMsg);

      if (attempt >= maxAttempts) {
         throw new Error(
            `Content generation failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`,
         );
      }

      // Wait before retry with exponential backoff
      await new Promise((resolve) =>
         setTimeout(resolve, CONTENT_CONFIG.RETRY_DELAY * attempt),
      );

      return generateContent(prompt, job, attempt + 1);
   }
}

// Enhanced content saving with better error handling and metadata
async function saveContent(
   request: ContentRequestWithAgent,
   generatedContent: GeneratedContentResult,
   usedSources: string[],
   job: Job,
): Promise<typeof content.$inferSelect> {
   const slug = slugify(request.topic);
   const metrics: ContentQualityMetrics =
      generatedContent.metadata &&
      typeof generatedContent.metadata.readabilityScore === "number"
         ? (generatedContent.metadata as ContentQualityMetrics)
         : calculateContentMetrics(generatedContent.content);

   try {
      job.log("Saving content to database...");

      // Check for slug conflicts and make unique if necessary
      let uniqueSlug = slug;
      let counter = 1;

      while (true) {
         const existing = await db.query.content.findFirst({
            where: eq(content.slug, uniqueSlug),
            columns: { id: true },
         });

         if (!existing) break;

         uniqueSlug = `${slug}-${counter}`;
         counter++;

         if (counter > 100) {
            // Prevent infinite loop
            uniqueSlug = `${slug}-${Date.now()}`;
            break;
         }
      }

      // Create content record with enhanced metadata
      const [newContent] = await db
         .insert(content)
         .values({
            agentId: request.agentId,
            body: generatedContent.content,
            title: request.topic,
            userId: request.userId,
            slug: uniqueSlug,
            wordsCount: metrics.wordCount,
            readTimeMinutes: metrics.readingTime,
            qualityScore: metrics.readabilityScore,
            topics: generatedContent.metadata?.topics || [],
            sources: usedSources,
         })
         .returning();

      if (!newContent) {
         throw new Error("Failed to create content record - no data returned");
      }

      // Update the content request
      await db
         .update(contentRequest)
         .set({
            isCompleted: true,
            generatedContentId: newContent.id,
            // completedAt: new Date(), // If your schema has this field
         })
         .where(eq(contentRequest.id, request.id));

      await updateUserUsageForContentGeneration();

      return newContent;
   } catch (error) {
      const errorMsg = `Database error while saving content: ${error instanceof Error ? error.message : String(error)}`;
      job.log(errorMsg);
      throw new Error(errorMsg);
   }
}

// Enhanced queue configuration
export const contentGenerationQueue = new Queue("content-generation", {
   connection: redis,
   defaultJobOptions: {
      removeOnComplete: 25, // Keep more completed jobs for analytics
      removeOnFail: 50, // Keep failed jobs for debugging
      attempts: 3,
      backoff: {
         type: "exponential",
         delay: 5000,
      },
      delay: 1000, // Small delay to prevent overwhelming the API
   },
});

contentGenerationQueue.on("error", (err) => {
   console.error("Content generation queue error:", err);
});

// Enhanced worker with comprehensive error handling and monitoring
export const contentGenerationWorker = new Worker(
   "content-generation",
   async (job: Job<ContentGenerationJobData>) => {
      const { requestId, options = {} } = job.data;
      const startTime = Date.now();

      job.log(`Starting content generation for request: ${requestId}`);
      job.updateProgress(0);

      try {
         // Fetch request with agent data
         job.log("Fetching content request and agent data...");
         const request = await db.query.contentRequest.findFirst({
            where: eq(contentRequest.id, requestId),
            with: {
               agent: true,
            },
         });

         if (!request || !request.agent) {
            throw new Error(
               `Request ${requestId} or associated agent not found`,
            );
         }

         job.updateProgress(10);

         const { topic, briefDescription } = request;
         job.log(`Processing request for topic: "${topic}"`);

         // Enhanced RAG knowledge retrieval
         let knowledgeContext = "";
         let usedSources: string[] = [];

         if (options.includeKnowledgeBase !== false) {
            // Default to true
            job.log("Retrieving relevant knowledge and content...");
            job.updateProgress(20);

            const ragResults = await retrieveRelevantKnowledge(
               request.agentId,
               topic,
               briefDescription || "",
               job,
               options,
            );

            if (ragResults.knowledgeText) {
               const contextParts = [];

               if (ragResults.knowledgeText) {
                  contextParts.push(
                     "=== RELEVANT KNOWLEDGE BASE ===\n" +
                        ragResults.knowledgeText,
                  );
               }

               knowledgeContext = contextParts.join("\n\n");
               usedSources = ragResults.usedSources;

               job.log(
                  `Knowledge context prepared: ${knowledgeContext.length} characters from ${usedSources.length} sources`,
               );
            } else {
               job.log(
                  "No relevant knowledge found, proceeding with base agent knowledge",
               );
            }
         }

         job.updateProgress(40);

         // Build enhanced agent prompt
         job.log("Building content generation prompt...");
         const agentPromptOptions: AgentPromptOptions = {
            contentRequest: {
               topic,
               briefDescription,
            },
            additionalContext: knowledgeContext || undefined,
            specificRequirements: options.customPromptInstructions
               ? [options.customPromptInstructions]
               : undefined,
         };

         const prompt = generateAgentPrompt(request.agent, agentPromptOptions);

         job.log(`Generated prompt length: ${prompt.length} characters`);
         job.updateProgress(50);

         // Generate content
         job.log("Generating content with AI...");
         const generatedContent = await generateContent(prompt, job);
         job.updateProgress(80);

         // Save content to database
         job.log("Saving generated content...");
         const savedContent = await saveContent(
            request,
            generatedContent,
            usedSources,
            job,
         );
         job.updateProgress(95);

         const endTime = Date.now();
         const processingTime = endTime - startTime;

         job.updateProgress(100);
         job.log(`Content generation completed in ${processingTime}ms`);

         // Return comprehensive result
         return {
            success: true,
            requestId,
            generatedContentId: savedContent.id,
            contentSlug: savedContent.slug,
            metrics: {
               processingTimeMs: processingTime,
               wordCount: generatedContent.metadata?.wordCount || 0,
               readingTime: generatedContent.metadata?.readingTime || 0,
               sourcesUsed: usedSources.length,
               qualityScore: generatedContent.metadata?.readabilityScore || 0,
            },
            sources: usedSources,
         };
      } catch (error) {
         const processingTime = Date.now() - startTime;
         const errorMsg = `Content generation failed for request ${requestId} after ${processingTime}ms`;
         const fullError =
            error instanceof Error ? error.message : String(error);

         job.log(`ERROR: ${errorMsg} - ${fullError}`);

         // Update request status to indicate failure
         try {
            await db
               .update(contentRequest)
               .set({
                  isCompleted: false,
                  // failureReason: fullError, // If your schema supports this
               })
               .where(eq(contentRequest.id, requestId));
         } catch (dbError) {
            job.log(
               `Failed to update request status: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
            );
         }

         throw new Error(`${errorMsg}: ${fullError}`);
      }
   },
   {
      connection: redis,
      concurrency: 3, // Limit concurrent content generation
      limiter: {
         max: 20, // Max jobs per duration
         duration: 60000, // 1 minute
      },
   },
);

// Enhanced event handlers
contentGenerationWorker.on("error", (err) => {
   console.error("Content generation worker error:", err);
});

contentGenerationWorker.on("failed", (job, err) => {
   console.error(`Content generation job ${job?.id} failed:`, err);
});

contentGenerationWorker.on("completed", (job, result) => {
   console.log(`Content generation job ${job.id} completed:`, {
      requestId: result.requestId,
      contentId: result.generatedContentId,
      processingTime: result.metrics?.processingTimeMs,
      wordCount: result.metrics?.wordCount,
   });
});

contentGenerationWorker.on("progress", (job, progress) => {
   if (typeof progress === "number" && progress % 25 === 0) {
      // Log every 25% progress
      console.log(`Content generation job ${job.id} progress: ${progress}%`);
   }
});

// Graceful shutdown with better cleanup
async function gracefulShutdown(signal: string) {
   console.log(`Received ${signal}, initiating graceful shutdown...`);

   try {
      console.log("Closing content generation worker...");
      await contentGenerationWorker.close();

      console.log("Closing content generation queue...");
      await contentGenerationQueue.close();

      console.log("Content generation services closed gracefully");
   } catch (error) {
      console.error("Error during shutdown:", error);
   }

   process.exit(0);
}

async function updateUserUsageForContentGeneration() {
   const user = await auth.api.subscriptions({
      query: {
         active: true,
      },
   });

   if (user.length === 0) {
      await auth.api.checkout({
         body: {
            metadata: {
               usage: 10,
            },
         },
      });
   } else {
      await auth.api.ingestion({
         body: {
            event: "generated-content",
            metadata: {
               productId: env.POLAR_PREMIUM_PLAN,
               amount: 10,
            },
         },
      });
   }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Export utility functions for testing and external use
export {
   calculateContentMetrics,
   CONTENT_CONFIG,
   generateContent,
   retrieveRelevantKnowledge,
   slugify,
};
