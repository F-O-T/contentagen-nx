import { createTool } from "@mastra/core/tools";
import {
   createWebSearchUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";
import { getPaymentClient } from "@packages/payment/client";
import { z } from "zod";
import { serverEnv } from "@packages/environment/server";
import { tavily } from "@tavily/core";
import { AppError, propagateError } from "@packages/utils/errors";

export function getTavilySearchInstructions(): string {
   return ` tavily-search: Search the web for current information.
   - Use when you need up-to-date information, facts, or recent events
   - Provide clear, specific search queries for best results
   - Returns search results with relevant web content
   - Always provide user ID for billing purposes
   - Query should be concise but descriptive (2-6 words ideal)
   Examples:
   - "latest AI developments 2024"
   - "Python async await best practices"
   - "climate change statistics recent"`;
}

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
         const tavilyClient = tavily({ apiKey: serverEnv.TAVILY_API_KEY });
         const polarClient = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);
         const searchResult = await tavilyClient.search(query, {
            autoParameters: true,
            searchDepth: "basic",
         });
         const usageData = createWebSearchUsageMetadata({
            method: "search",
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
         propagateError(error);
         throw AppError.internal(
            `Search failed for userId=${userId}, query="${query}": ${(error as Error).message}`,
         );
      }
   },
});
