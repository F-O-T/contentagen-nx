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
    throw new Error("Couldnt crawl the website for brand knowledge");
  }

  // 2. Aggregate and summarize the crawled content
  const allContent = crawlResult.results
    .map((r) => r.rawContent || "")
    .join("\n\n");

  return { allContent };
}

export const crawlWebsiteForBrandKnowledgeTask = task({
  id: "crawl-website-for-brand-knowledge",
  run: runCrawlWebsiteForBrandKnowledge,
});
