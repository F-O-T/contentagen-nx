import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { researcherAgent } from "../agents/researcher-agent";
import { contentStrategistAgent } from "../agents/strategist-agent";
import { ContentRequestSchema } from "@packages/database/schema";
import { AppError } from "@packages/utils/errors";
import { interviewWriterAgent } from "../agents/interview-writer-agent";
import { tutorialWriterAgent } from "../agents/tutorial-writer-agent";
import { articleWriterAgent } from "../agents/article-writer-agent";
import { articleEditorAgent } from "../agents/article-editor-agent";
import { changelogWriterAgent } from "../agents/changelog/changelog-writer-agent";
import { changelogEditorAgent } from "../agents/changelog/changelog-editor-agent";
import { interviewEditorAgent } from "../agents/interview-editor-agent";
import { tutorialEditorAgent } from "../agents/tutorial-editor-agent";

const CreateNewContentWorkflowInputSchema = z.object({
   userId: z.string(),
   competitorIds: z.array(z.string()),
   organizationId: z.string(),
   request: ContentRequestSchema,
});
const strategyType = z
   .string()
   .describe("The detailed research on the content request");

const researchType = z
   .string()
   .describe("The detailed research on the content request");
const ContentResearchStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      research: researchType,
   });
const writingType = z
   .string()
   .describe("The detailed draft of the content, ready for editing");

const editorType = z.string().describe("The edited content, ready for review");
const contentResearchStep = createStep({
   id: "content-research-step",
   description: "Perform research on the requestd content",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentResearchStepOutputSchema,
   execute: async ({ inputData }) => {
      const { userId, competitorIds, organizationId, request } = inputData;
      const inputPrompt = `
i need you to peform a research on this content request.

request: ${request.description}

this is the content request is intended to be written as a ${request.layout}

competitorIds: ${competitorIds}
organizationId: ${organizationId}
userId: ${userId}
`;

      const result = await researcherAgent.generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: ContentResearchStepOutputSchema.pick({
               research: true,
            }),
         },
      );

      if (!result?.object.research) {
         throw AppError.validation('Agent output is missing "research" field');
      }
      return {
         research: result.object.research,
         userId,
         competitorIds,
         organizationId,
         request,
      };
   },
});
const ContentStrategyStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      strategy: strategyType,
   });
const contentStrategyStep = createStep({
   id: "content-strategy-step",
   description: "Peform a content strategy analysis on the requested topic",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentStrategyStepOutputSchema,
   execute: async ({ inputData }) => {
      const { userId, competitorIds, organizationId, request } = inputData;
      const inputPrompt = `
i need you to peform a content strategy analysis on this content request.

request: ${request.description}

this is the content request is intended to be written as a ${request.layout}

competitorIds: ${competitorIds}
organizationId: ${organizationId}
userId: ${userId}
`;
      const result = await contentStrategistAgent.generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: ContentStrategyStepOutputSchema.pick({
               strategy: true,
            }),
         },
      );
      if (!result?.object.strategy) {
         throw AppError.validation('Agent output is missing "strategy" field');
      }
      return {
         strategy: result.object.strategy,
         userId,
         competitorIds,
         organizationId,
         request,
      };
   },
});

const ContentWritingStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
   });
const contentWritingStep = createStep({
   id: "content-writing-step",
   description: "Write the content based on the content strategy and research",
   inputSchema: z.object({
      "content-research-step": ContentResearchStepOutputSchema.extend({
         research: researchType,
      }),
      "content-strategy-step": ContentStrategyStepOutputSchema.extend({
         strategy: strategyType,
      }),
   }),
   outputSchema: ContentWritingStepOutputSchema,
   execute: async ({ inputData }) => {
      const {
         "content-research-step": { research },
         "content-strategy-step": {
            strategy,
            competitorIds,
            organizationId,
            request,
            userId,
         },
      } = inputData;
      const inputPrompt = `
based on the content research and strategy, i need you to write the content.

request: ${request.description}

research: ${research}

strategy: ${strategy}
`;
      const getAgent = () => {
         if (request.layout === "tutorial") {
            return tutorialWriterAgent;
         } else if (request.layout === "interview") {
            return interviewWriterAgent;
         }
         if (request.layout === "changelog") {
            return changelogWriterAgent;
         }
         return articleWriterAgent;
      };
      const result = await getAgent().generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: ContentWritingStepOutputSchema.pick({
               writing: true,
            }),
         },
      );

      if (!result?.object.writing) {
         throw AppError.validation('Agent output is missing "research" field');
      }
      return {
         writing: result.object.writing,
         userId,
         competitorIds,
         organizationId,
         request,
      };
   },
});
const ContentEditorStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      editor: editorType,
   });
const contentEditorStep = createStep({
   id: "content-editor-step",
   description: "Edit the content based on the content research",
   inputSchema: CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
   }),
   outputSchema: ContentEditorStepOutputSchema,
   execute: async ({ inputData }) => {
      const { userId, competitorIds, organizationId, request, writing } =
         inputData;
      const inputPrompt = `
i need you to edit this content draft.

writing: ${writing}

`;
      const getAgent = () => {
         if (request.layout === "tutorial") {
            return tutorialEditorAgent;
         }
         if (request.layout === "interview") {
            return interviewEditorAgent;
         }
         if (request.layout === "changelog") {
            return changelogEditorAgent;
         }
         return articleEditorAgent;
      };
      const result = await getAgent().generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: ContentEditorStepOutputSchema.pick({
               editor: true,
            }),
         },
      );

      if (!result?.object.editor) {
         throw AppError.validation('Agent output is missing "editor" field');
      }
      return {
         editor: result.object.editor,
         userId,
         competitorIds,
         organizationId,
         request,
      };
   },
});

export const createNewContentWorkflow = createWorkflow({
   id: "create-new-content-workflow",
   description: "Create a new piece of content",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentEditorStepOutputSchema,
})
   .parallel([contentResearchStep, contentStrategyStep])
   .then(contentWritingStep)
   .then(contentEditorStep)
   .commit();
