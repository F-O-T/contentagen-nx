import { createWorkflow, createStep } from "@mastra/core";
import {
   countWords,
   readTimeMinutes,
   createSlug,
   extractTitleFromMarkdown,
   removeTitleFromMarkdown,
} from "@packages/utils/text";
import { updateContent } from "@packages/database/repositories/content-repository";
import { z } from "zod";
import {
   ContentRequestSchema,
   type ContentMeta,
   type ContentStats,
} from "@packages/database/schema";
import { createNewTutorialWorkflow } from "./content/create-new-tutorial-workflow";
import { createNewChangelogWorkflow } from "./content/create-new-changelog-workflow";
import { createNewArticleWorkflow } from "./content/create-new-article-workflow";
import { createNewInterviewWorkflow } from "./content/create-new-interview-workflow";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";

const CreateNewContentWorkflowInputSchema = z.object({
   userId: z.string(),
   competitorIds: z.array(z.string()),
   agentId: z.string(),
   contentId: z.string(),
   organizationId: z.string(),
   request: ContentRequestSchema,
});

const CreateNewContentWorkflowOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      rating: z.number().min(0).max(100),
      reasonOfTheRating: z
         .string()
         .describe("The reason for the rating, written in markdown"),
      editor: z.string().describe("The edited article, ready for review"),
   });

const saveContentStep = createStep({
   id: "save-content-step",
   description: "Save the content to the database",
   inputSchema: CreateNewContentWorkflowOutputSchema,

   execute: async ({ inputData }) => {
      const {
         userId,
         agentId,
         editor,
         rating,
         reasonOfTheRating,
         request,
         contentId,
      } = inputData;

      const dbClient = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      const stats: ContentStats = {
         wordsCount: countWords(editor).toString(),
         readTimeMinutes: readTimeMinutes(countWords(editor)).toString(),
         qualityScore: rating.toString(),
         reasonOfTheRating,
      };
      const meta: ContentMeta = {
         title: extractTitleFromMarkdown(editor),
         slug: createSlug(extractTitleFromMarkdown(editor)),
         description: "",
         keywords: [""],
         sources: [""],
      };
      await updateContent(dbClient, contentId, {
         status: "approved",
         agentId,
         request,
         stats,
         meta: {},
      });

      return {
         userId,
         agentId,
         request,
      };
   },
});

export const createNewContentWorkflow = createWorkflow({
   id: "create-new-content-workflow",
   description: "Create a new piece of content",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: CreateNewContentWorkflowOutputSchema,
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
   .then(saveContentStep)
   .commit();
