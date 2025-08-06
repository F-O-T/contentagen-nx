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

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runAnalyzeContent(payload: { content: string }) {
   const { content } = payload;

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

      return {
         stats,
         meta,
      };
   } catch (error) {
      console.error("Error during content analysis:", error);
      throw error;
   }
}
