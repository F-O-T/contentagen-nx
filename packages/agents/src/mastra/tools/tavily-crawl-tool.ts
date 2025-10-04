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

export function getTavilyCrawlInstructions(): string {
   return ` tavily-crawl: Extract detailed knowledge from specific websites.
   - Use when you need in-depth content from a known URL
   - Provide the full website URL to crawl
   - Give specific instructions for what to extract (max 400 chars)
   - Crawls up to 2 levels deep for comprehensive content
   - Always provide user ID for billing purposes
   - Instructions should focus on what information to extract
   Examples:
   - URL: "https://example.com" + instructions: "Extract product features and pricing"
   - URL: "https://blog.example.com" + instructions: "Find recent posts about AI trends"
   - URL: "https://docs.example.com" + instructions: "Get API endpoints and usage examples"`;
}

export const tavilyCrawlTool = createTool({
   id: "tavily-crawl",
   description: "Crawls a website url to extract knowledge and content",
   inputSchema: z.object({
      websiteUrl: z.url().describe("The website URL to crawl"),
      userId: z.string().describe("The user ID for billing purposes"),
      instructions: z
         .string()
         .describe(
            "Natual language instructions for the crawler to follow when crawling the website",
         )
         .transform((val) => val.slice(0, 400)),
   }),
   execute: async ({ context }) => {
      const { websiteUrl, userId } = context;

      try {
         const tavilyClient = tavily({ apiKey: serverEnv.TAVILY_API_KEY });
         const polarClient = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);
         const crawResult = await tavilyClient.crawl(websiteUrl, {
            maxDepth: 2,
            instructions: context.instructions,
         });
         const usageData = createWebSearchUsageMetadata({
            method: "crawl",
         });
         await ingestBilling(polarClient, {
            externalCustomerId: userId,
            metadata: usageData,
         });
         const { results } = crawResult;
         return { results };
      } catch (error) {
         console.error(
            `Brand crawl failed for userId=${userId}, websiteUrl="${websiteUrl}".`,
            error,
         );
         propagateError(error);
         throw AppError.internal(
            `Crawl failed for userId=${userId}, websiteUrl="${websiteUrl}": ${(error as Error).message}`,
         );
      }
   },
});
