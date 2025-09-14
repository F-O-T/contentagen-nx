import { createTool } from "@mastra/core/tools";
import {
   createWebSearchUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";
import { getPaymentClient } from "@packages/payment/client";
import { z } from "zod";
import { createTavilyClient } from "@packages/tavily/client";
import { tavilyCrawl } from "@packages/tavily/helpers";
import { serverEnv } from "@packages/environment/server";

export const tavilyCrawlTool = createTool({
   id: "tavily-crawl",
   description: "Crawls a website url to extract knowledge and content",
   inputSchema: z.object({
      websiteUrl: z.url().describe("The website URL to crawl"),
      userId: z.string().describe("The user ID for billing purposes"),
   }),
   execute: async ({ context }) => {
      const { websiteUrl, userId } = context;

      try {
         const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
         const polarClient = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);
         const crawResult = await tavilyCrawl(tavily, websiteUrl);
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
         throw error;
      }
   },
});
