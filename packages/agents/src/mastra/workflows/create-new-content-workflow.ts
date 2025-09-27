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

const type = CreateNewContentWorkflowInputSchema.extend({
   rating: z.number().min(0).max(100),
   reasonOfTheRating: z
      .string()
      .describe("The reason for the rating, written in markdown"),
   editor: z.string().describe("The edited article, ready for review"),
   metaDescription: z
      .string()
      .describe(
         "The meta description, being a SEO optmizaed description of the article",
      ),
   keywords: z
      .array(z.string())
      .describe("The associeated keywords of the content"),
   sources: z.array(z.string()).describe("The sources found on the search"),
});
const CreateNewContentWorkflowOutputSchema = z.object({
   "create-new-changelog-workflow": type,
   "create-new-article-workflow": type,
   "create-new-tutorial-workflow": type,
});

const saveContentStep = createStep({
   id: "save-content-step",
   description: "Save the content to the database",
   inputSchema: CreateNewContentWorkflowOutputSchema,
   outputSchema: z.object({
      success: z.boolean(),
   }),
   execute: async ({ inputData }) => {
      const {
         "create-new-changelog-workflow": {
            editor,
            keywords,
            metaDescription,
            rating,
            reasonOfTheRating,
            sources,
            agentId,
            contentId,
            request,
         },
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
         description: metaDescription,
         keywords,
         sources,
      };
      await updateContent(dbClient, contentId, {
         status: "draft",
         agentId,
         request,
         stats,
         meta,
         body: removeTitleFromMarkdown(editor),
      });

      return {
         success: true,
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
         }) => layout === "article",
         createNewArticleWorkflow,
      ],
   ])
   .then(saveContentStep)
   .commit();
