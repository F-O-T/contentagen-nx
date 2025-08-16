import { createTavilyClient } from "@packages/tavily/client";
import { serverEnv } from "@packages/environment/server";
import { billingWebSearchIngestionQueue } from "../queues/billing-websearch-ingestion-queue";

interface AutoBrandKnowledgePayload {
   query: string;
   userId: string;
}

const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
export async function runWebSearch(payload: AutoBrandKnowledgePayload) {
   const { query, userId } = payload;

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
      await billingWebSearchIngestionQueue.add("web-search-sources", {
         method: "search",
         userId,
      });

      return { searchResult };
   } catch (error) {
      console.error("Error during web search:", error);
      throw error;
   }
}
