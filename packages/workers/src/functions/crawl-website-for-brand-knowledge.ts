import { brandCrawlerPrompt } from "@packages/prompts/prompt/search/brand-crawler";
import { createTavilyClient } from "@packages/tavily/client";
import { serverEnv } from "@packages/environment/server";
import { billingWebSearchIngestionQueue } from "../queues/billing-websearch-ingestion-queue";

interface AutoBrandKnowledgePayload {
   websiteUrl: string;
   userId: string;
}

const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
export async function runCrawlWebsiteForBrandKnowledge(
   payload: AutoBrandKnowledgePayload,
) {
   const { websiteUrl, userId } = payload;
   // 1. Crawl the website for brand knowledge
   try {
      console.log(`[runCrawlWebsiteForBrandKnowledge] Crawling: ${websiteUrl}`);
      const crawlResult = await tavily.crawl(websiteUrl, {
         max_depth: 1,
         limit: 20,
         instructions: brandCrawlerPrompt(),
      });
      if (
         !crawlResult ||
         !crawlResult.results ||
         crawlResult.results.length === 0
      ) {
         console.error(
            `[runCrawlWebsiteForBrandKnowledge] ERROR: No crawl results for ${websiteUrl}`,
         );
         throw new Error("Couldnt crawl the website for brand knowledge");
      }
      console.log(
         `[runCrawlWebsiteForBrandKnowledge] Crawled ${crawlResult.results.length} pages for ${websiteUrl}`,
      );
      await billingWebSearchIngestionQueue.add("web-search-website-crawl", {
         method: "crawl",
         userId,
      });
      // 2. Aggregate and summarize the crawled content
      const allContent = crawlResult.results
         .map((r) => r.rawContent || "")
         .join("\n\n");
      console.log(
         `[runCrawlWebsiteForBrandKnowledge] Aggregated content length: ${allContent.length}`,
      );
      return { allContent };
   } catch (error) {
      console.error(
         `[runCrawlWebsiteForBrandKnowledge] Unhandled error:`,
         error,
      );
      throw error;
   }
}
