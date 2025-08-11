import { contentMetaPrompt } from "@packages/prompts/prompt/content/content_meta";

import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import {
   ContentMetaSchema,
   type ContentMeta,
   type ContentStats,
} from "@packages/database/schemas/content"; // or wherever your schemas are
import { createAiUsageMetadata } from "@packages/payment/ingestion";
import { runIngestBilling } from "./ingest-usage";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runAnalyzeContent(payload: {
   content: string;
   userId: string;
}) {
   const { content, userId } = payload;
   const countContentWords = (text: string): number => {
      return text
         .trim()
         .split(/\s+/)
         .filter((word) => word.length > 0).length;
   };
   const readTimeMinutes = (wordCount: number): number => {
      const wordsPerMinute = 200; // Average reading speed
      return Math.ceil(wordCount / wordsPerMinute);
   };
   try {
      const statsResult = {
         wordsCount: countContentWords(content).toString(),
         readTimeMinutes: readTimeMinutes(
            countContentWords(content),
         ).toString(),
      };
      const metaResult = await generateOpenRouterObject(
         openrouter,
         {
            model: "medium",
            reasoning: "low",
         },
         ContentMetaSchema,
         {
            system: contentMetaPrompt(),
            prompt: content,
         },
      );

      const stats = statsResult as ContentStats;
      const meta = metaResult.object as ContentMeta;

      // Validate that we got meaningful results
      if (!stats.wordsCount && !stats.readTimeMinutes && !stats.qualityScore) {
         throw new Error("Stats analysis returned empty results");
      }

      if (
         !meta.slug &&
         (!meta.tags || meta.tags.length === 0) &&
         (!meta.topics || meta.topics.length === 0)
      ) {
         throw new Error("Meta analysis returned empty results");
      }
      if (!metaResult.usage.outputTokens || !metaResult.usage.inputTokens) {
         console.error("[runAnalyzeContent] ERROR: No usage data returned");
         throw new Error("No usage data returned from analysis");
      }
      await runIngestBilling({
         params: {
            metadata: createAiUsageMetadata({
               effort: "small",
               inputTokens: metaResult.usage.inputTokens,
               outputTokens: metaResult.usage.outputTokens,
            }),
            event: "LLM",
            externalCustomerId: userId, // This is a system-level operation, not user-specific
         },
      });

      return {
         stats,
         meta,
      };
   } catch (error) {
      console.error("Error during content analysis:", error);
      throw error;
   }
}
