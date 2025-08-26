import { Worker, Queue, type Job } from "bullmq";
import { runRagByKeywords } from "../../functions/rag/brand-knowledge-rag-by-keywords";
import { runGenerateIdea } from "../../functions/writing/generate-idea";
import { runExternalLinkCuration } from "../../functions/web-search/external-link-curation";
import { runGetAgent } from "../../functions/database/get-agent";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { createDb } from "@packages/database/client";
import { createIdea } from "@packages/database/repositories/ideas-repository";
import { emitAgentKnowledgeStatusChanged } from "@packages/server-events";

export interface IdeaGenerationJobData {
   agentId: string;
   keywords: string[];
}

const QUEUE_NAME = "idea-generation-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const ideaGenerationQueue = new Queue<IdeaGenerationJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(ideaGenerationQueue);

export async function enqueueIdeaGenerationJob(
   data: IdeaGenerationJobData,
   jobOptions?: Parameters<Queue<IdeaGenerationJobData>["add"]>[2],
) {
   return ideaGenerationQueue.add(QUEUE_NAME, data, jobOptions);
}

// Removed unused imports after keyword logic change

export const ideaGenerationWorker = new Worker<IdeaGenerationJobData>(
   QUEUE_NAME,
   async (job: Job<IdeaGenerationJobData>) => {
      const { agentId, keywords } = job.data;
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      try {
         emitAgentKnowledgeStatusChanged({
            agentId,
            status: "pending",
            message: "Generating ideas...",
         });
         // 1. Fetch agent info
         const { agent } = await runGetAgent({ agentId });
         const userId = agent.userId;

         // 3. RAG search with provided keywords
         const ragResult = await runRagByKeywords({ agentId, keywords });
         const brandContext = ragResult.chunks.join("\n");

         const { results } = await runExternalLinkCuration({
            query: keywords.join(", "),
            userId,
         });
         const sources = results.flat().map((r) => r.url);
         const webSnippets = results
            .flat()
            .map((r) => r.content)
            .join("\n");

         // 5. Generate ideas (LLM)
         const { ideas } = await runGenerateIdea({
            brandContext,
            webSnippets,
            keywords,
         });

         // 6. Persist each idea to DB and emit event
         for (const ideaContent of ideas) {
            const meta = { tags: keywords, source: sources.join(",") };
            const createdIdea = await createIdea(db, {
               agentId,
               content: ideaContent,
               status: "pending",
               meta,
            });
            emitAgentKnowledgeStatusChanged({
               agentId,
               status: "completed",
               message: `Idea created: ${createdIdea.content}`,
            });
         }
      } catch (error) {
         emitAgentKnowledgeStatusChanged({
            agentId,
            status: "failed",
            message: `Error generating ideas: ${error instanceof Error ? error.message : String(error)}`,
         });
         console.error("[IdeaGenerationWorker] Error:", error);
      }
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(ideaGenerationWorker);
