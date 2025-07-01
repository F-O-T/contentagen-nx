import { Queue, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../integrations/database";
import { openRouter } from "../integrations/openrouter";
import type { agent as Agent, ContentLength } from "../schemas/content-schema";
import { content, contentRequest, type agent } from "../schemas/content-schema";
import { redis } from "../services/redis";
import { embeddingService } from "../services/embedding";

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
      generateTags: boolean;
      internalLinkFormat: 'mdx' | 'html';
      includeMetaTags: boolean;
      includeMetaDescription: boolean;
      frontmatterFormatting: boolean;
   },
): string {
   // Map ContentLength to detailed descriptions
   const lengthDescriptions: Record<ContentLength, string> = {
      short: "Quick and concise content (500-800 words)",
      medium: "Balanced content with good detail (800-1500 words)",
      long: "Comprehensive and in-depth content (1500+ words)",
   };

   // Build base prompt without tag placeholders
   let prompt = `
${agent.basePrompt || `You are ${agent.name}, an expert content creator specializing in ${agent.contentType} with a ${agent.voiceTone} tone for ${agent.targetAudience}.`}

---

## Content Request Details

You have received a new content request. Please create content according to your agent profile and the specifications below:

**Topic**: ${params.topic}
**Brief Description**: ${params.briefDescription}
**Target Length**: ${params.targetLength} (${lengthDescriptions[params.targetLength]})

## Additional Instructions

1. Follow your established voice, tone, and style guidelines
2. Ensure the content provides genuine value to your target audience
3. Structure the content according to your formatting preferences
4. Make the content engaging and actionable`;

   // Add meta tags and description instructions if requested
   if (params.includeMetaTags || params.includeMetaDescription) {
      prompt += `\n5. Include relevant meta information:`;
      if (params.includeMetaTags) {
         prompt += `\n   - Add appropriate meta tags for SEO optimization`;
      }
      if (params.includeMetaDescription) {
         prompt += `\n   - Include a compelling meta description (150-160 characters)`;
      }
   }

   // Add internal link formatting instructions
   prompt += `\n6. Format internal links using ${params.internalLinkFormat.toUpperCase()} format:`;
   if (params.internalLinkFormat === 'mdx') {
      prompt += `\n   - Use MDX link syntax: [Link Text](./relative-path)`;
   } else {
      prompt += `\n   - Use HTML link syntax: <a href="./relative-path">Link Text</a>`;
   }

   // Add frontmatter formatting instructions
   if (params.frontmatterFormatting) {
      prompt += `\n7. Format output as MDX/Markdown with YAML frontmatter containing title, description, and other metadata`;
   }

   // Build output requirements
   prompt += `\n\n## Output Requirements\n\n`;
   
   if (params.generateTags) {
      prompt += `The output must be a valid JSON object with exactly two keys:
- "content": The complete content as a string, properly formatted in Markdown${params.frontmatterFormatting ? ' with YAML frontmatter' : ''}
- "tags": An array of 3-8 relevant lowercase tags (no duplicates)

Example output format:
{
  "content": "${params.frontmatterFormatting ? '---\\ntitle: Article Title\\ndescription: Brief description\\n---\\n\\n# Article Title\\n\\nYour complete article content here...' : '# Article Title\\n\\nYour complete article content here...'}",
  "tags": ["content-marketing", "copywriting", "seo"]
}`;
   } else {
      prompt += `The output must be a valid JSON object with exactly one key:
- "content": The complete content as a string, properly formatted in Markdown${params.frontmatterFormatting ? ' with YAML frontmatter' : ''}

Example output format:
{
  "content": "${params.frontmatterFormatting ? '---\\ntitle: Article Title\\ndescription: Brief description\\n---\\n\\n# Article Title\\n\\nYour complete article content here...' : '# Article Title\\n\\nYour complete article content here...'}"
}`;
   }

   prompt += `\n\nDo not include any explanations or additional text outside the JSON object.`;

   // Append tag generation instructions if enabled
   if (params.generateTags) {
      prompt += `\n\n## Tag Generation Instructions

Generate 3-8 relevant tags that:
- Are lowercase and use hyphens for multi-word tags
- Accurately represent the content's main topics and themes
- Include both broad category tags and specific topic tags
- Avoid duplicates and overly generic terms
- Help with content discovery and categorization`;
   }

   return prompt;
}

async function generateContent(prompt: string, generateTags: boolean) {
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
      
      // Ensure tags array exists based on generateTags setting
      if (generateTags && !result.tags) {
         result.tags = [];
      } else if (!generateTags) {
         result.tags = [];
      }
      
      return result;
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
   
   // Use generated tags if generateTags is true, otherwise use existing request tags or extract from topic
   const generateTags = request.generateTags ?? false;
   let tags: string[] = [];
   
   if (generateTags) {
      tags = extractTags(generatedContent.tags, request.topic);
   } else {
      // Use existing tags from request, or empty array if none
      tags = request.tags || [];
   }
   
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
         embedding,
      })
      .returning();

   // Update request with tags, approved status and completion
   // Note: We don't include embedding in the update to avoid sending vectors in the payload
   await db
      .update(contentRequest)
      .set({
         isCompleted: true,
         generatedContentId: newContent?.id,
         approved: true, // Set approved = true after content updates
         tags: tags, // Set the tags array based on generation or existing
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

         const {
            agent,
            topic,
            briefDescription,
            targetLength
         } = request;

         // Handle nullable boolean and enum values with proper defaults
         const generateTags = request.generateTags ?? false;
         const internalLinkFormat = request.internalLinkFormat ?? 'mdx';
         const includeMetaTags = request.includeMetaTags ?? false;
         const includeMetaDescription = request.includeMetaDescription ?? false;
         const frontmatterFormatting = request.frontmatterFormatting ?? false;

         const prompt = generateAgentPrompt(agent, {
            topic,
            briefDescription,
            targetLength,
            generateTags,
            internalLinkFormat,
            includeMetaTags,
            includeMetaDescription,
            frontmatterFormatting,
         });

         const generatedContent = await generateContent(prompt, generateTags);

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
