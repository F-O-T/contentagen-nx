import { Queue, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../integrations/database";
import { openRouter } from "../integrations/openrouter";
import type { agent as Agent, ContentLength } from "../schemas/content-schema";
import { content, contentRequest, type agent } from "../schemas/content-schema";
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

function generateAgentPrompt(
   agent: typeof Agent.$inferSelect,
   params: {
      topic: string;
      briefDescription: string;
      targetLength: ContentLength;
   },
): string {
   // Map ContentLength to detailed descriptions
   const lengthDescriptions: Record<ContentLength, string> = {
      short: "Quick and concise content (500-800 words)",
      medium: "Balanced content with good detail (800-1500 words)",
      long: "Comprehensive and in-depth content (1500+ words)",
   };
   return `
You are an expert copywriter and SEO strategist. Your job is to craft high-quality, engaging, and SEO-optimized content tailored to the agent profile and the content request below. Use advanced copywriting techniques, ensure clarity, and maximize the content's discoverability.

**Agent Profile:**
- **Name:** ${agent.name}
- **Description:** ${agent.description}
- **Content Type:** ${agent.contentType}
- **Voice Tone:** ${agent.voiceTone}
- **Target Audience:** ${agent.targetAudience}
- **Formatting Style:** ${agent.formattingStyle}
- **SEO Focus:** ${agent.seoFocus}

**Content Request:**
- **Topic:** ${params.topic}
- **Brief Description:** ${params.briefDescription}
- **Target Length:** ${params.targetLength} (${
      lengthDescriptions[params.targetLength]
   })

**IMPORTANT:** Your response must be a valid JSON object with two keys: "content" and "tags".
- "content": The full, SEO-optimized text.
- "tags": An array of relevant tags as strings.

Example output:
{
  "content": "This is the full text of the article...",
  "tags": ["seo", "copywriting", "digital marketing"]
}
`;
}

async function generateContent(prompt: string) {
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
      return JSON.parse(generatedText);
   } catch (error) {
      console.error("Failed to parse JSON response from AI:", error);
      throw new Error("Invalid JSON response from AI");
   }
}

function calculateWordsCount(text: string): number {
   return text.split(/\s+/).length;
}

function calculateTimeToRead(wordsCount: number): number {
   const wordsPerMinute = 200; // Average reading speed
   return Math.ceil(wordsCount / wordsPerMinute);
}

function extractTags(
   generatedTags: string[] | string,
   topic: string,
): string[] {
   let tags: string[] = [];
   if (typeof generatedTags === "string" && generatedTags.length > 0) {
      tags = generatedTags
         .split(",")
         .map((tag) => tag.trim())
         .filter((tag) => tag.length > 0);
   } else if (Array.isArray(generatedTags) && generatedTags.length > 0) {
      tags = generatedTags
         .map((tag) => String(tag).trim())
         .filter((tag) => tag.length > 0);
   }

   if (tags.length === 0) {
      tags = topic.split(" ").map((tag) => tag.trim().toLowerCase());
   }

   return tags;
}

async function saveContent(
   request: ContentRequestWithAgent,
   generatedContent: { content: string; tags: string[] | string },
) {
   const slug = slugify(request.topic);
   const tags = extractTags(generatedContent.tags, request.topic);
   const wordsCount = calculateWordsCount(generatedContent.content);
   const timeToRead = calculateTimeToRead(wordsCount);

   const [newContent] = await db
      .insert(content)
      .values({
         agentId: request.agentId,
         body: generatedContent.content,
         title: request.topic,
         userId: request.userId,
         slug,
         tags,
         wordsCount,
         readTimeMinutes: timeToRead,
      })
      .returning();

   await db
      .update(contentRequest)
      .set({
         isCompleted: true,
         generatedContentId: newContent?.id,
      })
      .where(eq(contentRequest.id, request.id));

   return newContent;
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
            throw new Error("Request or agent not found");
         }

         const { agent, topic, briefDescription, targetLength } = request;

         const prompt = generateAgentPrompt(agent, {
            topic,
            briefDescription,
            targetLength,
         });

         const generatedContent = await generateContent(prompt);

         await saveContent(request, generatedContent);

         job.log(`Successfully processed content for request: ${requestId}`);
      } catch (error) {
         console.error(
            `Failed to process content for request: ${requestId}`,
            error,
         );
         throw error;
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

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
