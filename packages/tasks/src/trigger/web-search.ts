import { createTavilyClient } from "@packages/tavily/client";
import { serverEnv } from "@packages/environment/server";
import { task, logger } from "@trigger.dev/sdk/v3";

interface AutoBrandKnowledgePayload {
   query: string;
}

const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
async function runWebSearch(payload: AutoBrandKnowledgePayload) {
   const { query } = payload;

   // 1. Crawl the website for brand knowledge
   try {
      logger.info("[BrandKnowledge] Starting web search for query", { query });
      const searchResult = await tavily.search(query);
      if (
         !searchResult ||
         !searchResult.results ||
         searchResult.results.length === 0
      ) {
         logger.error(
            "[BrandKnowledge] No results returned from Tavily web search",
            {
               query,
               searchResult,
            },
         );
         throw new Error(
            "Could not perform the web search for brand knowledge; no results found",
         );
      }
      // 2. Aggregate and summarize the search content
      const allContent = searchResult.results
         .map((r) => r.content || "")
         .join("\n\n");
      logger.info("[BrandKnowledge] Web search succeeded", {
         query,
         resultCount: searchResult.results.length,
      });
      return { allContent };
   } catch (error) {
      logger.error("[BrandKnowledge] Web search failed", {
         query,
         error: (error as Error)?.message || error,
      });
      throw error;
   }
}

export const webSerchTask = task({
   id: "web-search-job",
   run: runWebSearch,
});
