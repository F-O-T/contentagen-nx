import { env } from "@api/config/env";
import { auth } from "@api/integrations/auth";
import { Queue, Worker } from "bullmq";
import { eq, sql } from "drizzle-orm";
import { db } from "../integrations/database";
import { openRouter } from "../integrations/openrouter";
import { content, contentRequest, type agent } from "../schemas/content-schema";
import {
   generateContentRequestPrompt,
   type AgentPromptOptions,
} from "../services/agent-prompt";
import { embeddingService } from "../services/embedding";
import { redis } from "../services/redis";

export type ContentRequestWithAgent = typeof contentRequest.$inferSelect & {
   agent: typeof agent.$inferSelect;
};

export const contentGenerationQueue = new Queue("content-generation", {
   connection: redis,
});

contentGenerationQueue.on("error", (err) => {
   console.error("Content generation queue error:", err);
});

function slugify(text: string) {
   return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w-]+/g, "") // Remove all non-word chars
      .replace(/--+/g, "-") // Replace multiple - with single -
      .replace(/^-+/, "") // Trim - from start of text
      .replace(/-+$/, ""); // Trim - from end of text
}

async function generateContent(prompt: string): Promise<{ content: string }> {
   const response = await openRouter.chat.completions.create({
      model: "qwen/qwen3-30b-a3b-04-28",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
   });

   const generatedText = response.choices[0]?.message?.content;

   if (!generatedText) {
      throw new Error("Content generation failed");
   }

   try {
      const result = JSON.parse(generatedText);

      // Verify result.content is a string before returning
      if (typeof result.content !== "string") {
         throw new Error("AI response does not contain valid content string");
      }

      // Return only content
      return { content: result.content };
   } catch (error) {
      console.error("Failed to parse JSON response from AI:", error);
      throw new Error("Invalid JSON response from AI");
   }
}

function calculateWordsCount(text: string | undefined | null): number {
   if (typeof text !== "string") return 0;
   return text.split(/\s+/).length;
}

function calculateTimeToRead(wordsCount: number): number {
   const wordsPerMinute = 200; // Average reading speed
   return Math.ceil(wordsCount / wordsPerMinute);
}

async function saveContent(
   request: ContentRequestWithAgent,
   generatedContent: { content: string },
) {
   const slug = slugify(request.topic);

   const wordsCount = calculateWordsCount(generatedContent.content);
   const timeToRead = calculateTimeToRead(wordsCount);

   let embedding: number[] | undefined;
   try {
      // Generate embedding for the content
      embedding = await embeddingService.generateContentEmbedding(
         request.topic,
         generatedContent.content,
      );
   } catch (error) {
      console.error("Failed to generate embedding for content:", error);
      // Continue without embedding - can be generated later
   }

   try {
      const [newContent] = await db
         .insert(content)
         .values({
            agentId: request.agentId,
            body: generatedContent.content,
            title: request.topic,
            userId: request.userId,
            slug,
            wordsCount,
            readTimeMinutes: timeToRead,
            embedding,
         })
         .returning();

      if (!newContent) {
         throw new Error("Failed to create content record");
      }

      // Update request with completion
      // Note: approved field is left as-is (remains false)
      await db
         .update(contentRequest)
         .set({
            isCompleted: true,
            generatedContentId: newContent.id,
         })
         .where(eq(contentRequest.id, request.id));

      await updateUserUsageForContentGeneration();

      return newContent;
   } catch (error) {
      console.error("Database error while saving content:", error);
      throw new Error(
         `Failed to save content: ${error instanceof Error ? error.message : String(error)}`,
      );
   }
}

export const contentGenerationWorker = new Worker(
   "content-generation",
   async (job) => {
      const { requestId } = job.data;
      job.log(`Processing content generation for request: ${requestId}`);

      try {
         const request = await db.query.contentRequest.findFirst({
            where: eq(contentRequest.id, requestId),
            with: {
               agent: true,
            },
         });

         if (!request || !request.agent) {
            const errorMsg = `Request ${requestId} or associated agent not found`;
            job.log(errorMsg);
            throw new Error(errorMsg);
         }

         const { topic, briefDescription, targetLength } = request;

         // Handle nullable boolean and enum values with proper defaults
         const internalLinkFormat = request.internalLinkFormat ?? "mdx";
         const includeMetaTags = request.includeMetaTags ?? false;
         const includeMetaDescription = request.includeMetaDescription ?? false;

         // === RAG: Retrieve relevant knowledge base content ===
         job.log("Generating embedding for content request...");
         let relevantDocsText: string | undefined;
         let usedKnowledgeBase = false;
         try {
            // 1. Generate embedding for the current request
            await embeddingService.generateContentRequestEmbedding(
               topic,
               briefDescription,
            );

            // 2. Query the content table for top 3 most similar documents (vector search)
            //    Only consider content with non-null embeddings
            const similarContents = await db
               .select({
                  id: content.id,
                  title: content.title,
                  body: content.body,
                  embedding: content.embedding,
               })
               .from(content)
               .where(sql`embedding IS NOT NULL`)
               .limit(3);
            // NOTE: Vector similarity ordering removed due to missing l2Distance method.
            // If needed, implement similarity sorting in JS after fetching.

            // 3. Extract and concatenate relevant content, or handle empty/missing KB
            if (Array.isArray(similarContents) && similarContents.length > 0) {
               relevantDocsText = similarContents
                  .map(
                     (doc, idx) =>
                        `Relevant Document #${idx + 1}:\nTitle: ${doc.title}\nContent: ${doc.body}\n`,
                  )
                  .join("\n");
               usedKnowledgeBase = true;
               job.log(
                  `Injected ${similarContents.length} relevant knowledge base documents into the prompt.`,
               );
            } else {
               relevantDocsText = undefined;
               usedKnowledgeBase = false;
               job.log(
                  "No relevant knowledge base documents found or knowledge base is empty. Proceeding without injected knowledge.",
               );
            }
         } catch (ragError) {
            relevantDocsText = undefined;
            usedKnowledgeBase = false;
            job.log(
               `Knowledge base retrieval failed or unavailable: ${ragError instanceof Error ? ragError.message : String(ragError)}. Proceeding with standard prompt.`,
            );
         }

         // === END RAG ===

         const promptOptions: AgentPromptOptions = {
            topic,
            description: briefDescription,
            targetLength,
            linkFormat: internalLinkFormat,
            includeMetaTags,
            includeMetaDescription,
         };

         // Inject retrieved knowledge into the prompt
         if (usedKnowledgeBase && relevantDocsText) {
            job.log(
               `Generating content prompt for topic: ${topic} with injected knowledge base context.`,
            );
         } else {
            job.log(
               `Generating content prompt for topic: ${topic} without injected knowledge base context.`,
            );
         }
         let prompt = generateContentRequestPrompt(promptOptions, {
            ...request.agent,
            contentType: request.agent.contentType ?? "blog_posts",
            formattingStyle: request.agent.formattingStyle ?? "structured",
         });
         // If relevantDocsText exists, prepend it to the prompt.
         if (usedKnowledgeBase && relevantDocsText) {
            prompt = `${relevantDocsText}\n\n${prompt}`;
         }

         job.log(`Calling AI service to generate content`);
         const generatedContent = await generateContent(prompt);

         job.log(`Saving generated content to database`);
         const savedContent = await saveContent(request, generatedContent);

         job.log(
            `Successfully processed content for request: ${requestId}, generated content ID: ${savedContent?.id}`,
         );

         // Return the generated content ID for job completion tracking
         return {
            success: true,
            requestId,
            generatedContentId: savedContent?.id,
         };
      } catch (error) {
         const errorMsg = `Failed to process content for request: ${requestId}`;
         console.error(errorMsg, error);
         job.log(
            `ERROR: ${errorMsg} - ${error instanceof Error ? error.message : String(error)}`,
         );

         // Re-throw to ensure job fails and can be retried if needed
         throw new Error(
            `${errorMsg}: ${error instanceof Error ? error.message : String(error)}`,
         );
      }
   },
   { connection: redis },
);

contentGenerationWorker.on("error", (err) => {
   console.error("Content generation worker error:", err);
});

async function gracefulShutdown(signal: string) {
   console.log(`Received ${signal}, closing worker...`);
   await contentGenerationWorker.close();
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
