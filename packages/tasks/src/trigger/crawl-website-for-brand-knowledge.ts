import { brandCrawlerPrompt } from "@packages/prompts/prompt/search/brand-crawler";
import { createTavilyClient } from "@packages/tavily/client";
import { serverEnv } from "@packages/environment/server";
import { task, logger } from "@trigger.dev/sdk/v3";

interface AutoBrandKnowledgePayload {
   websiteUrl: string;
}

const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
async function runCrawlWebsiteForBrandKnowledge(
   payload: AutoBrandKnowledgePayload,
) {
   const { websiteUrl } = payload;
   logger.info("Starting auto brand knowledge workflow", {
      websiteUrl,
   });

   // 1. Crawl the website for brand knowledge
   try {
      logger.info("[BrandKnowledge] Crawling website", { websiteUrl });
      const crawlResult = await tavily.crawl(websiteUrl, {
         max_depth: 2,
         limit: 20,
         instructions: brandCrawlerPrompt(),
      });
      if (
         !crawlResult ||
         !crawlResult.results ||
         crawlResult.results.length === 0
      ) {
         logger.error("[BrandKnowledge] No results from crawl", {
            websiteUrl,
            crawlResult,
         });
         throw new Error("Couldnt crawl the website for brand knowledge");
      }
      logger.info("[BrandKnowledge] Crawling complete", {
         websiteUrl,
         resultsCount: crawlResult.results.length,
      });
      // 2. Aggregate and summarize the crawled content
      logger.info("[BrandKnowledge] Aggregating and summarizing content", {
         websiteUrl,
         resultsCount: crawlResult.results.length,
      });
      const allContent = crawlResult.results
         .map((r) => r.rawContent || "")
         .join("\n\n");
      logger.info("[BrandKnowledge] Aggregation complete", {
         websiteUrl,
         summaryLength: allContent.length,
      });
      return { allContent };
   } catch (error) {
      logger.error("[BrandKnowledge] Error during workflow", {
         websiteUrl,
         error: error instanceof Error ? error.message : error,
      });
      throw error;
   }
}

export const crawlWebsiteForBrandKnowledgeTask = task({
   id: "crawl-website-for-brand-knowledge",
   run: runCrawlWebsiteForBrandKnowledge,
});
