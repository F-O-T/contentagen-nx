import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import {
   blogIdeasInputPrompt,
   blogIdeasPrompt,
   ideaSchema,
   type IdeaSchema,
} from "@packages/prompts/prompt/writing/blog-ideas-prompt";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import type { PersonaConfig } from "@packages/database/schema";
import { createLanguageSection } from "@packages/prompts/helpers/assemble-writing-prompt";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

// Configuration constants
const MAX_RETRIES = 3;
const TIMEOUT_MS = 60000; // 60 seconds
const EXPECTED_IDEAS_COUNT = 5; // Match the number of placeholder ideas created

export async function runGenerateIdea(payload: {
   personaConfig: PersonaConfig;
   brandContext: string;
   webSnippets: string;
   keywords: string[];
}) {
   const { brandContext, webSnippets, keywords, personaConfig } = payload;

   let lastError: Error | null = null;

   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
         console.log(
            `[runGenerateIdea] Attempt ${attempt}/${MAX_RETRIES} for keywords: ${keywords.join(", ")}`,
         );

         const system = [
            blogIdeasPrompt(),
            createLanguageSection(personaConfig, false),
         ].join(`\n\n${"=".repeat(80)}\n\n`);

         const prompt = blogIdeasInputPrompt(
            brandContext,
            webSnippets,
            keywords,
         );

         // Create a timeout promise
         const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(
               () =>
                  reject(
                     new Error(
                        `LLM generation timed out after ${TIMEOUT_MS}ms`,
                     ),
                  ),
               TIMEOUT_MS,
            );
         });

         // Race between the LLM call and timeout
         const result = await Promise.race([
            generateOpenRouterObject(
               openrouter,
               { model: "small" },
               ideaSchema,
               { prompt, system },
            ),
            timeoutPromise,
         ]);

         const { ideas } = result.object as IdeaSchema;

         // Validate that we got the expected number of ideas
         if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
            throw new Error(
               `No ideas generated for keywords: ${keywords.join(", ")}`,
            );
         }

         // Validate each idea has required content
         const validIdeas = ideas.filter(
            (idea) =>
               idea &&
               typeof idea.title === "string" &&
               typeof idea.description === "string" &&
               idea.title.trim().length > 0 &&
               idea.description.trim().length > 0,
         );

         if (validIdeas.length === 0) {
            throw new Error(
               `All generated ideas are invalid or empty for keywords: ${keywords.join(", ")}`,
            );
         }

         // If we got fewer than expected, log a warning but don't fail
         if (validIdeas.length < EXPECTED_IDEAS_COUNT) {
            console.warn(
               `[runGenerateIdea] Generated ${validIdeas.length} valid ideas, expected ${EXPECTED_IDEAS_COUNT}`,
            );
         }

         console.log(
            `[runGenerateIdea] Successfully generated ${validIdeas.length} ideas on attempt ${attempt}`,
         );
         return { ideas: validIdeas };
      } catch (error) {
         lastError = error as Error;
         console.error(
            `[runGenerateIdea] Attempt ${attempt}/${MAX_RETRIES} failed:`,
            {
               error: lastError.message,
               keywords: keywords.join(", "),
               attempt,
            },
         );

         // If this is not the last attempt, wait before retrying
         if (attempt < MAX_RETRIES) {
            const delay = Math.min(1000 * 2 ** (attempt - 1), 10000); // Exponential backoff, max 10s
            console.log(`[runGenerateIdea] Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
         }
      }
   }

   // All retries failed
   console.error(
      `[runGenerateIdea] All ${MAX_RETRIES} attempts failed for keywords: ${keywords.join(", ")}`,
   );
   throw new Error(
      `Failed to generate ideas after ${MAX_RETRIES} attempts. Last error: ${lastError?.message || "Unknown error"}`,
   );
}
