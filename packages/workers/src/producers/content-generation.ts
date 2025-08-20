import { Worker, Queue, type Job } from "bullmq";
import type { ContentRequest } from "@packages/database/schema";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { runGetAgent } from "../functions/database/get-agent";
import { runGetContentKeywords } from "../functions/chunking/get-content-keywords";
import { runRagByKeywords } from "../functions/rag/brand-knowledge-rag-by-keywords";
import { runGetImprovedSearchQuery } from "../functions/chunking/get-improved-search-query";
import { runExternalLinkCuration } from "../functions/web-search/external-link-curation";
import { runWriteImprovedDescription } from "../functions/writing/write-improved-description";
import { runWriteContentDraft } from "../functions/writing/write-content-draft";
import { runEditContentDraft } from "../functions/writing/edit-content-draft";

export async function runContentGeneration(payload: {
   agentId: string;
   contentId: string;
   contentRequest: ContentRequest;
}) {
   const { agentId, contentId, contentRequest } = payload;
   const { description } = contentRequest;
   try {
      const { agent } = await runGetAgent({ agentId });
      const { userId } = agent;
      const [improvedSearchQueryResult, contentKeywordsResult] =
         await Promise.all([
            runGetImprovedSearchQuery({
               inputText: description,
               userId,
            }),
            runGetContentKeywords({
               inputText: description,
               userId,
            }),
         ]);
      const { optimizedQuery } = improvedSearchQueryResult;
      const { keywords } = contentKeywordsResult;
      const { chunks } = await runRagByKeywords({
         agentId: agent.id,
         keywords,
      });
      const [
         optimizedQueryReult,
         keywordsSearchResult,
         createBrandIntegrationDocumentResult,
      ] = await Promise.all([
         runExternalLinkCuration({
            query: optimizedQuery,
            userId,
         }),
         runExternalLinkCuration({
            query: keywords.join(", "),
            userId,
         }),
         runWriteImprovedDescription({
            chunks,
            userId,
            description,
         }),
      ]);
      const searchSources = () => {
         // Combine and deduplicate the sources from both search results
         const allSources = [
            ...keywordsSearchResult.results,
            ...optimizedQueryReult.results,
         ];
         const uniqueSources = Array.from(
            new Set(allSources.map((result) => result.url).filter(Boolean)),
         );
         return uniqueSources;
      };
      const getSearchResults = () => {
         // Combine and deduplicate the contents from both search results
         const allResults = [
            ...keywordsSearchResult.results,
            ...optimizedQueryReult.results,
         ];
         const uniqueContents = Array.from(
            new Set(
               allResults
                  .map((result) => result.content?.trim())
                  .filter((content) => !!content && content.length > 0),
            ),
         );
         return uniqueContents.join("\n\n");
      };
      const { brandIntegrationDocumentation } =
         createBrandIntegrationDocumentResult;

      const { draft } = await runWriteContentDraft({
         data: {
            brandDocument: brandIntegrationDocumentation,
            webSearchContent: getSearchResults(),
            contentRequest,
         },
         userId,
      });
      const { content } = await runEditContentDraft({
         data: {
            draft,
         },
         userId,
      });
      console.info("[ContentGeneration] Content generated", content);

      return { contentId, content };
   } catch (error) {
      console.error("[ContentGeneration] PIPELINE ERROR", {
         agentId,
         contentId,
         contentRequest,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "content-generation-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const contentGenerationQueue = new Queue(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(contentGenerationQueue);

export const contentGenerationWorker = new Worker(
   QUEUE_NAME,
   async (
      job: Job<{
         agentId: string;
         contentId: string;
         contentRequest: ContentRequest;
      }>,
   ) => {
      await runContentGeneration(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(contentGenerationWorker);
