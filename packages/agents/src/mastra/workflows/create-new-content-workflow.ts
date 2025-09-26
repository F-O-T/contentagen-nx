import { createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { createNewTutorialWorkflow } from "./content/create-new-tutorial-workflow";
import { createNewChangelogWorkflow } from "./content/create-new-changelog-workflow";
import { createNewArticleWorkflow } from "./content/create-new-article-workflow";
import { createNewInterviewWorkflow } from "./content/create-new-interview-workflow";

const CreateNewContentWorkflowInputSchema = z.object({
   userId: z.string(),
   competitorIds: z.array(z.string()),
   organizationId: z.string(),
   request: ContentRequestSchema,
});

export const createNewContentWorkflow = createWorkflow({
   id: "create-new-content-workflow",
   description: "Create a new piece of content",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: CreateNewContentWorkflowInputSchema.extend({
      rating: z.number().min(0).max(100),
      reasonOfTheRating: z
         .string()
         .describe("The reason for the rating, written in markdown"),
   }),
})
   .branch([
      [
         async ({
            inputData: {
               request: { layout },
            },
         }) => layout === "tutorial",
         createNewTutorialWorkflow,
      ],
      [
         async ({
            inputData: {
               request: { layout },
            },
         }) => layout === "changelog",
         createNewChangelogWorkflow,
      ],
      [
         async ({
            inputData: {
               request: { layout },
            },
         }) => layout === "interview",
         createNewInterviewWorkflow,
      ],
      [
         async ({
            inputData: {
               request: { layout },
            },
         }) => layout === "article",
         createNewArticleWorkflow,
      ],
   ])
   .commit();
