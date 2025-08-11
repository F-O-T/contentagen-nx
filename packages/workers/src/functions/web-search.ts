import { createTavilyClient } from "@packages/tavily/client";
import { serverEnv } from "@packages/environment/server";
import { createWebSearchUsageMetadata } from "@packages/payment/ingestion";
import { runIngestBilling } from "./ingest-usage";

interface AutoBrandKnowledgePayload {
   query: string;
   userId: string;
}

const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
export async function runWebSearch(payload: AutoBrandKnowledgePayload) {
   const { query, userId } = payload;

   // 1. Crawl the website for brand knowledge
   try {
      const searchResult = await tavily.search(query);
      if (
         !searchResult ||
         !searchResult.results ||
         searchResult.results.length === 0
      ) {
         throw new Error(
            "Could not perform the web search for brand knowledge; no results found",
         );
      }
      await runIngestBilling({
         params: {
            metadata: createWebSearchUsageMetadata({
               method: "search",
            }),
            event: "WEB_SEARCH",
            externalCustomerId: userId, // This is a system-level operation, not user-specific
         },
      });

      // 2. Aggregate and summarize the search content
      const allContent = searchResult.results
         .map((r) => r.content || "")
         .join("\n\n");
      return { allContent };
   } catch (error) {
      console.error("Error during web search:", error);
      throw error;
   }
}
