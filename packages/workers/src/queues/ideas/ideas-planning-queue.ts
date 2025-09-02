import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runGetAgent } from "../../functions/database/get-agent";
import { runRagByKeywords } from "../../functions/rag/brand-knowledge-rag-by-keywords";
import { runExternalLinkCuration } from "../../functions/web-search/external-link-curation";
import { createDb } from "@packages/database/client";
import { createIdea } from "@packages/database/repositories/ideas-repository";
import { emitIdeaStatusChanged } from "@packages/server-events";

export interface IdeasPlanningJobData {
   agentId: string;
   keywords: string[];
   ideaId?: string;
}

export interface IdeasPlanningJobResult {
   agentId: string;
   keywords: string[];
   brandContext: string;
   sources: string[];
   webSnippets: string;
   userId: string;
   ideaIds: string[];
}

import { enqueueIdeasGrammarCheckJob } from "./ideas-grammar-checker-queue";

export async function runIdeasPlanning(
   payload: IdeasPlanningJobData,
): Promise<IdeasPlanningJobResult> {
   const { agentId, keywords } = payload;

   try {
      // 1. Fetch agent info
      const { agent } = await runGetAgent({ agentId });
      const userId = agent.userId;

      // 2. Create placeholder idea entries in database
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      const ideaIds: string[] = [];

      // Create a placeholder idea entry for tracking
      const placeholderIdea = await createIdea(db, {
         agentId,
         content: {
            title: "Idea Generation in Progress",
            description: `Generating ideas for keywords: ${keywords.join(", ")}`,
         },
         status: "pending",
         meta: { tags: keywords, source: "planning-stage" },
      });

      ideaIds.push(placeholderIdea.id);

      emitIdeaStatusChanged({
         ideaId: placeholderIdea.id,
         status: "pending",
         message: "Planning idea generation...",
      });

      // 3. RAG search with provided keywords
      const ragResult = await runRagByKeywords({ agentId, keywords });
      const brandContext = ragResult.chunks.join("\n");

      // 4. External link curation
      const { results } = await runExternalLinkCuration({
         query: keywords.join(", "),
         userId,
      });
      const sources = results.flat().map((r) => r.url);
      const webSnippets = results
         .flat()
         .map((r) => r.content)
         .join("\n");

      // 5. Enqueue grammar check job with the created idea ID
      await enqueueIdeasGrammarCheckJob({
         agentId,
         keywords,
         brandContext,
         sources,
         webSnippets,
         userId,
         personaConfig: agent.personaConfig,
         ideaIds,
      });

      return {
         agentId,
         keywords,
         brandContext,
         sources,
         webSnippets,
         userId,
         ideaIds,
      };
   } catch (error) {
      console.error("[IdeasPlanning] PIPELINE ERROR", {
         agentId,
         keywords,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "ideas-planning-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const ideasPlanningQueue = new Queue<IdeasPlanningJobData>(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(ideasPlanningQueue);

export async function enqueueIdeasPlanningJob(
   data: IdeasPlanningJobData,
   jobOptions?: Parameters<Queue<IdeasPlanningJobData>["add"]>[2],
) {
   return ideasPlanningQueue.add(QUEUE_NAME, data, jobOptions);
}

export const ideasPlanningWorker = new Worker<IdeasPlanningJobData>(
   QUEUE_NAME,
   async (job: Job<IdeasPlanningJobData>) => {
      await runIdeasPlanning(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(ideasPlanningWorker);
