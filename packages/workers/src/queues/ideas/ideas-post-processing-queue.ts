import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { createDb } from "@packages/database/client";
import { updateIdea } from "@packages/database/repositories/ideas-repository";
import { emitIdeaStatusChanged } from "@packages/server-events";

export interface IdeasPostProcessingJobData {
   agentId: string;
   keywords: string[];
   correctedIdeas: string[];
   sources: string[];
   userId: string;
   ideaIds: string[];
}

export interface IdeasPostProcessingJobResult {
   agentId: string;
   updatedIdeas: Array<{ id: string; title: string }>;
   userId: string;
}

// Simple confidence scoring based on idea length and keyword matches
function generateConfidenceScore(
   idea: string,
   keywords: string[],
): { score: string; rationale: string } {
   let score = 50; // Base score
   let rationale = "Base confidence score";

   // Length factor
   if (idea.length > 100) {
      score += 20;
      rationale += ". Good length indicates well-developed idea";
   } else if (idea.length < 30) {
      score -= 10;
      rationale += ". Idea may be too brief";
   }

   // Keyword matches
   const keywordMatches = keywords.filter((keyword) =>
      idea.toLowerCase().includes(keyword.toLowerCase()),
   ).length;

   if (keywordMatches > 0) {
      score += keywordMatches * 5;
      rationale += `. Matches ${keywordMatches} keywords`;
   }

   // Ensure score is within bounds
   score = Math.max(0, Math.min(100, score));

   return {
      score: score.toString(),
      rationale,
   };
}

export async function runIdeasPostProcessing(
   payload: IdeasPostProcessingJobData,
): Promise<IdeasPostProcessingJobResult> {
   const agentId = payload.agentId;
   const keywords = payload.keywords;
   const correctedIdeas = payload.correctedIdeas;
   const sources = payload.sources;
   const userId = payload.userId;
   const ideaIds = payload.ideaIds;

   try {
      // Emit status for all idea IDs
      for (const ideaId of ideaIds) {
         emitIdeaStatusChanged({
            ideaId,
            status: "pending",
            message: "Finalizing ideas...",
         });
      }

      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      const updatedIdeas: Array<{ id: string; title: string }> = [];

      // Process each corrected idea and update existing idea entries
      for (let i = 0; i < correctedIdeas.length; i++) {
         const ideaContent = correctedIdeas[i];
         const ideaId = ideaIds[i] || ideaIds[0]; // Use first idea ID if we have more ideas than IDs

         if (!ideaId || !ideaContent) {
            console.warn(
               `No idea ID or content available for corrected idea at index ${i}`,
            );
            continue;
         }

         // At this point, TypeScript knows ideaId and ideaContent are defined
         const confirmedIdeaId: string = ideaId;
         const confirmedIdeaContent: string = ideaContent;
         const confirmedKeywords: string[] = keywords || [];

         const meta = { tags: confirmedKeywords, source: sources.join(",") };
         const confidence = generateConfidenceScore(
            confirmedIdeaContent,
            confirmedKeywords,
         );

         const updatedIdea = await updateIdea(db, confirmedIdeaId, {
            content: {
               title: confirmedIdeaContent,
               description: `Generated idea based on keywords: ${confirmedKeywords.join(", ")}`,
            },
            confidence,
            status: "pending",
            meta,
         });

         updatedIdeas.push({
            id: updatedIdea.id,
            title: confirmedIdeaContent,
         });

         // Emit event for each updated idea
         emitIdeaStatusChanged({
            ideaId: updatedIdea.id,
            status: "pending",
            message: `Idea finalized: ${confirmedIdeaContent}`,
         });
      }

      return {
         agentId,
         updatedIdeas,
         userId,
      };
   } catch (error) {
      console.error("[IdeasPostProcessing] PIPELINE ERROR", {
         agentId,
         keywords,
         ideaIds,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "ideas-post-processing-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const ideasPostProcessingQueue = new Queue<IdeasPostProcessingJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(ideasPostProcessingQueue);

export async function enqueueIdeasPostProcessingJob(
   data: IdeasPostProcessingJobData,
   jobOptions?: Parameters<Queue<IdeasPostProcessingJobData>["add"]>[2],
) {
   return ideasPostProcessingQueue.add(QUEUE_NAME, data, jobOptions);
}

export const ideasPostProcessingWorker = new Worker<IdeasPostProcessingJobData>(
   QUEUE_NAME,
   async (job: Job<IdeasPostProcessingJobData>) => {
      await runIdeasPostProcessing(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(ideasPostProcessingWorker);
