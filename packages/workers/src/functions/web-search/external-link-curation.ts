import { createTavilyClient } from "@packages/tavily/client";
import { tavilySearch } from "@packages/tavily/helpers";
import { serverEnv } from "@packages/environment/server";
import { enqueueBillingWebSearchIngestionJob } from "../../queues/billing-websearch-ingestion-queue";

type ExternalLinkCurationPayload = {
   query: string;
   userId: string;
};

const tavily = createTavilyClient(serverEnv.TAVILY_API_KEY);
export async function runExternalLinkCuration(
   payload: ExternalLinkCurationPayload,
) {
   const { query, userId } = payload;

   try {
      const searchResult = await tavilySearch(tavily, query, {
         autoParameters: true,
         searchDepth: "advanced",
      });
      await enqueueBillingWebSearchIngestionJob({
         method: "advanced",
         userId,
      });

      const { results } = searchResult;
      return { results };
   } catch (error) {
      console.error(
         `External link curation failed for userId=${userId}, query="${query}".`,
         error,
      );
      throw error;
   }
}
