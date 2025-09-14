import { createTool } from "@mastra/core/tools";
import {
   createWebSearchUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";
import { getPaymentClient } from "@packages/payment/client";
import { z } from "zod";
import { createTavilyClient } from "@packages/tavily/client";
import { tavilySearch } from "@packages/tavily/helpers";
import { serverEnv } from "@packages/environment/server";

export const tavilySearchTool = createTool({
   id: "tavily-search",
   description: "Searches the web for relevant content",
   inputSchema: z.object({
      query: z.string().describe("The search query"),
      userId: z.string().describe("The user ID for billing purposes"),
   }),
   execute: async ({ context }) => {
      const { query, userId } = context;

      try {
         const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
         const polarClient = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);
         const searchResult = await tavilySearch(tavily, query, {
            autoParameters: true,
            searchDepth: "advanced",
         });
         const usageData = createWebSearchUsageMetadata({
            method: "crawl",
         });
         await ingestBilling(polarClient, {
            externalCustomerId: userId,
            metadata: usageData,
         });
         const { results } = searchResult;
         return { results };
      } catch (error) {
         console.error(
            `Brand crawl failed for userId=${userId}, query="${query}".`,
            error,
         );
         throw error;
      }
   },
});
