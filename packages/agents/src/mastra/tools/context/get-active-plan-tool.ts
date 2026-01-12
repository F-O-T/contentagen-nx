import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { ContentPlan } from "../../schemas/plan-schema";

export function getActivePlanInstructions(): string {
   return `
## GET ACTIVE PLAN TOOL
Retrieves the active content plan if one exists.

**When to use:**
- At the START of writing to check if there's a plan to execute
- When you need to reference plan steps or research insights

**Parameters:** None

**Returns:**
- hasPlan: Whether a plan exists
- summary: Plan overview
- steps: Ordered steps to execute
- researchInsights: SERP intent, topics, gaps, and suggestedKeywords
- targetKeywords: Keywords to target (CRITICAL - use these!)
- estimatedWordCount: Target word count
- suggestedTitle: Recommended title with primary keyword
- suggestedDescription: Recommended meta description

**IMPORTANT - Using targetKeywords:**
The targetKeywords array contains keywords YOU MUST use in content:
- **targetKeywords[0]** = PRIMARY keyword
  - Use in title (via editTitle)
  - Use in first 100 words of content
  - Use in at least one H2 heading
  - Target 1-2% density throughout
- **targetKeywords[1-9]** = SECONDARY keywords
  - Use naturally in headings and paragraphs
  - Don't force them - integrate where relevant

These are NOT just for frontmatter metadata - you MUST incorporate them in the actual text content!

**If no plan exists**, hasPlan will be false and you should ask the user what to write.
`;
}

export const getActivePlanTool = createTool({
   id: "get-active-plan",
   description:
      "Retrieves the active content plan from context. Call this at the start of writing to check if there's a plan to execute.",
   inputSchema: z.object({}),
   execute: async (_inputData, context) => {
      const requestContext = context?.requestContext;
      const activePlan = requestContext?.get("activePlan") as
         | ContentPlan
         | undefined;

      if (!activePlan) {
         return {
            hasPlan: false,
            message: "No active plan. Ask the user what content to write.",
         };
      }

      return {
         hasPlan: true,
         summary: activePlan.summary,
         steps: activePlan.steps.map((step, index) => ({
            number: index + 1,
            id: step.id,
            title: step.title,
            description: step.description,
            toolsToUse: step.toolsToUse,
            rationale: step.rationale,
            estimatedMarkdown: step.estimatedMarkdown,
         })),
         researchInsights: activePlan.researchInsights
            ? {
                 serpIntent: activePlan.researchInsights.serpIntent,
                 topTopics: activePlan.researchInsights.topRankingTopics,
                 contentGaps: activePlan.researchInsights.contentGaps,
                 suggestedKeywords:
                    activePlan.researchInsights.suggestedKeywords,
              }
            : null,
         targetKeywords: activePlan.targetKeywords,
         estimatedWordCount: activePlan.estimatedWordCount,
         suggestedTitle: activePlan.suggestedTitle,
         suggestedDescription: activePlan.suggestedDescription,
      };
   },
});
