import { contentMetaPrompt } from "@packages/prompts/prompt/content/content_meta";
import { contentStatsPrompt } from "@packages/prompts/prompt/content/content_stats";

import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import {
   ContentStatsSchema,
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

   try {
      const [statsResult, metaResult] = await Promise.all([
         generateOpenRouterObject(
            openrouter,
            {
               model: "medium",
               reasoning: "low",
            },
            ContentStatsSchema,
            {
               system: contentStatsPrompt(),
               prompt: content,
            },
         ),
         generateOpenRouterObject(
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
         ),
      ]);
      const stats = statsResult.object as ContentStats;
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
      if (!statsResult.usage.inputTokens || !metaResult.usage.inputTokens) {
         console.error("[runAnalyzeContent] ERROR: No usage data returned");
         throw new Error("No usage data returned from analysis");
      }
      if (!statsResult.usage.outputTokens || !metaResult.usage.outputTokens) {
         console.error(
            "[runAnalyzeContent] ERROR: No output tokens used in analysis",
         );
         throw new Error("No output tokens used in analysis");
      }
      const outputTokens =
         statsResult.usage?.outputTokens + metaResult.usage?.outputTokens;
      const inputTokens =
         statsResult.usage?.inputTokens + metaResult.usage?.inputTokens;
      await runIngestBilling({
         params: {
            metadata: createAiUsageMetadata({
               effort: "small",
               inputTokens: inputTokens,
               outputTokens: outputTokens,
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
