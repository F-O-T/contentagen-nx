import { generateOpenRouterObject } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import {
   ContentMetaSchema,
   ContentStatsSchema,
   type ContentMeta,
   type ContentStats,
} from "@packages/database/schemas/content"; // or wherever your schemas are
import {
   countWords,
   createSlug,
   extractTitleFromMarkdown,
   readTimeMinutes,
} from "@packages/helpers/text";
import { contentStatsPrompt } from "@packages/prompts/prompt/content/content_stats";
import { billingLlmIngestionQueue } from "../queues/billing-llm-ingestion-queue";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export async function runAnalyzeContent(payload: {
   content: string;
   userId: string;
}) {
   const { content, userId } = payload;
   try {
      const statsResult = {
         wordsCount: countWords(content).toString(),
         readTimeMinutes: readTimeMinutes(countWords(content)).toString(),
      };
      const baseMeta = {
         title: extractTitleFromMarkdown(content),
         slug: createSlug(extractTitleFromMarkdown(content)),
         keywords,
         sources,
      };
      const schema = z.object({
         qualityScore: ContentStatsSchema.pick({
            qualityScore: true,
         }),
         description: ContentMetaSchema.pick({
            description: true,
         }),
      });
      const [qualityScoreResult, metaResult] = await Promise.all([
         generateOpenRouterObject(
            openrouter,
            {
               model: "small",
               reasoning: "low",
            },
            schema,
            {
               system: contentStatsPrompt(),
               prompt: content,
            },
         ),
      ]);
      const qualityScoreObject = qualityScoreResult.object as Pick<
         ContentStats,
         "qualityScore"
      >;
      const metaObject = metaResult.object as Pick<ContentMeta, "description">;
      console.log(
         "[runAnalyzeContent] qualityScoreObject:",
         qualityScoreObject,
      );
      const stats = {
         ...statsResult,
         qualityScore: qualityScoreObject.qualityScore,
      } as ContentStats;
      const meta = {
         ...baseMeta,
         description: metaObject.description,
      } as ContentMeta;
      const getTotalTokens = () => {
         if (
            !qualityScoreResult?.usage?.inputTokens ||
            !metaResult?.usage?.inputTokens ||
            !metaResult?.usage?.outputTokens ||
            !qualityScoreResult?.usage?.outputTokens
         ) {
            throw new Error("Token usage data is missing");
         }
         return {
            input:
               qualityScoreResult.usage.inputTokens +
               metaResult.usage.inputTokens,
            output:
               qualityScoreResult.usage.outputTokens +
               metaResult.usage.outputTokens,
         };
      };
      const total = getTotalTokens();
      await billingLlmIngestionQueue.add("metadata-generation", {
         inputTokens: total.input,
         outputTokens: total.output,
         effort: "small",
         userId, // This is a system-level operation, not user-specific
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
