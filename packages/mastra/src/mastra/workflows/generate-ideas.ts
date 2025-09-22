import { createWorkflow, createStep } from "@mastra/core/workflows";
import { getPaymentClient } from "@packages/payment/client";
import {
   createAiUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";
import { ideaGenerationAgent } from "../agents/ideas-agent";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { createIdea } from "@packages/database/repositories/ideas-repository";
import { emitIdeaStatusChanged } from "@packages/server-events";
import { z } from "zod";

type LLMUsage = {
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
   reasoningTokens?: number | null;
   cachedInputTokens?: number | null;
};

async function ingestUsage(usage: LLMUsage, userId: string) {
   const paymentClient = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);
   const usageMetadata = createAiUsageMetadata({
      effort: "small",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
   });
   await ingestBilling(paymentClient, {
      externalCustomerId: userId,
      metadata: usageMetadata,
   });
}

export const GenerateIdeasInput = z.object({
   agentId: z.string(),
   keywords: z.array(z.string()),
   userId: z.string(),
});

// Generated idea schema
const GeneratedIdeaSchema = z.object({
   title: z.string().min(1),
   description: z.string().min(1),
   layout: z.enum(["tutorial", "interview", "article", "changelog"]),
   confidence: z.object({
      score: z.string().min(1),
      rationale: z.string(),
   }),
   keywords: z.array(z.string()),
   sources: z.array(z.string()).optional(),
});

// Output schema for the workflow
export const GenerateIdeasOutput = z.object({
   generatedIdeas: z.array(GeneratedIdeaSchema),
   totalIdeas: z.number(),
});

const generateIdeasStep = createStep({
   id: "generate-ideas-step",
   description: "Generate content ideas using ideas-agent",
   inputSchema: GenerateIdeasInput,
   outputSchema: GenerateIdeasInput.extend({
      generatedIdeas: z.array(GeneratedIdeaSchema),
   }),

   execute: async ({ inputData }) => {
      const { agentId, keywords, userId } = inputData;

      console.log(
         `[GenerateIdeas] Starting idea generation for agent ${agentId} with keywords: ${keywords.join(", ")}`,
      );

      const inputPrompt = `
Generate 4 compelling blog post ideas based on these keywords: ${keywords.join(", ")}

Use the available tools to:
1. Query brand information to understand the brand's voice and audience
2. Research current trends and competitor content
3. Consider the brand's features and differentiation
4. Generate unique ideas that will resonate with the target audience

Return exactly 4 ideas in the structured format requested.
`;

      const result = await ideaGenerationAgent.generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: z.object({
               ideas: z.array(GeneratedIdeaSchema),
            }),
         },
      );

      await ingestUsage(result.usage as LLMUsage, userId);

      if (!result?.object) {
         throw new Error(
            `Failed to generate ideas: ideaGenerationAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { ideas: generatedIdeas } = result.object;

      console.log(
         `[GenerateIdeas] Successfully generated ${generatedIdeas.length} ideas`,
      );

      return {
         ...inputData,
         generatedIdeas,
      };
   },
});

// Step 2: Save ideas to database
const saveIdeasToDatabase = createStep({
   id: "save-ideas-to-database-step",
   description: "Save generated ideas to database",
   inputSchema: GenerateIdeasInput.extend({
      generatedIdeas: z.array(GeneratedIdeaSchema),
   }),
   outputSchema: GenerateIdeasOutput,

   execute: async ({ inputData }) => {
      const { agentId, generatedIdeas } = inputData;
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      const ideaIds: string[] = [];

      console.log(
         `[SaveIdeas] Saving ${generatedIdeas.length} ideas to database for agent ${agentId}`,
      );

      for (const idea of generatedIdeas) {
         if (!idea || !idea.title || !idea.description) {
            console.warn(`[SaveIdeas] Skipping invalid idea`, {
               title: idea?.title,
               description: idea?.description,
            });
            continue;
         }

         try {
            const createdIdea = await createIdea(db, {
               agentId,
               content: {
                  title: idea.title,
                  description: idea.description,
               },
               confidence: {
                  score: idea.confidence.score,
                  rationale: idea.confidence.rationale,
               },
               status: "pending",
               meta: {
                  tags: idea.keywords,
                  sources: idea.sources || [],
               },
            });

            ideaIds.push(createdIdea.id);

            // Emit status change event
            emitIdeaStatusChanged({
               ideaId: createdIdea.id,
               status: "pending",
               message: "Idea generated successfully",
            });

            console.log(
               `[SaveIdeas] Created idea ${createdIdea.id} with title: "${idea.title}"`,
            );
         } catch (error) {
            console.error(
               `[SaveIdeas] Failed to save idea: "${idea.title}"`,
               error,
            );
            // Continue with other ideas even if one fails
         }
      }

      console.log(
         `[SaveIdeas] Successfully saved ${ideaIds.length} ideas to database`,
      );

      return {
         generatedIdeas,
         ideaIds,
         totalIdeas: ideaIds.length,
      };
   },
});

// Create the workflow
export const generateIdeasWorkflow = createWorkflow({
   id: "generate-ideas-workflow",
   description: "Generate content ideas using ideas-agent and save to database",
   inputSchema: GenerateIdeasInput,
   outputSchema: GenerateIdeasOutput,
})
   .then(generateIdeasStep)
   .then(saveIdeasToDatabase)
   .commit();

