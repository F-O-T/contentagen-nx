import { createTavilyClient } from "@packages/tavily/client";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { saveContentTask } from "../trigger/save-content";
import { knowledgeDistillationTask } from "./knowledge-distillation";
import { serverEnv } from "@packages/environment/server";
import { task, logger, batch } from "@trigger.dev/sdk/v3";

interface AutoBrandKnowledgePayload {
   agentId: string;
   userId: string;
   websiteUrl: string;
}

export async function runAutoBrandKnowledge(
   payload: AutoBrandKnowledgePayload,
) {
   const { agentId, userId, websiteUrl } = payload;
   const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
   const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

   logger.info("Starting auto brand knowledge workflow", {
      agentId,
      websiteUrl,
   });

   // 1. Crawl the website for brand knowledge
   const crawlResult = await tavily.crawl(websiteUrl, {
      max_depth: 2,
      limit: 20,
      instructions:
         "Extract all main pages and sections that describe the brand, its services, about, contact, and any unique value propositions.",
   });

   if (
      !crawlResult ||
      !crawlResult.results ||
      crawlResult.results.length === 0
   ) {
      throw new Error("Tavily crawl returned no results");
   }

   // 2. Aggregate and summarize the crawled content
   const allContent = crawlResult.results
      .map((r) => r.rawContent || "")
      .join("\n\n");

   // 3. Define the 5 slots (customize as needed)
   const slots = [
      {
         name: "about",
         prompt: "Summarize the brand's story, mission, and values.",
      },
      {
         name: "services",
         prompt: "List and describe the main services or products offered.",
      },
      {
         name: "contact",
         prompt:
            "Extract the contact information and how customers can reach the brand.",
      },
      {
         name: "unique",
         prompt:
            "What makes this brand unique? Summarize the unique value proposition.",
      },
      {
         name: "testimonials",
         prompt:
            "Extract or synthesize testimonials or social proof if available.",
      },
   ];

   // 4. For each slot, use the LLM to generate content
   const slotContents = await Promise.all(
      slots.map(async (slot) => {
         const result = await generateOpenRouterText(
            openrouter,
            { model: "medium", reasoning: "medium" },
            {
               system: `You are an expert brand copywriter. Use the following website content to answer the user's request.\n\nCONTENT:\n${allContent}`,
               prompt: slot.prompt,
            },
         );
         return { name: slot.name, content: result.text.trim() };
      }),
   );

   // 5. Save each slot as a content file/record
   const savedContents = await Promise.all(
      slotContents.map(async (slot) => {
         // You may want to generate a unique contentId for each slot
         const contentId = `${agentId}-${slot.name}`;
         await saveContentTask.triggerAndWait({
            contentId,
            content: slot.content,
         });
         return { contentId, ...slot };
      }),
   );

   // 6. Trigger the distillation pipeline in batch for all 5 slots
   await batch.triggerAndWait<typeof knowledgeDistillationTask>(
      savedContents.map((slot) => ({
         id: "knowledge-distillation-job",
         payload: {
            inputText: slot.content,
            agentId,
            sourceId: slot.contentId,
         },
      })),
   );

   logger.info("Auto brand knowledge workflow complete", {
      agentId,
      websiteUrl,
   });
   return { slots: savedContents };
}

export const autoBrandKnowledgeTask = task({
   id: "auto-brand-knowledge-workflow",
   run: runAutoBrandKnowledge,
});
