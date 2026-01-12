import { createTool } from "@mastra/core/tools";
import {
   type ContentPlan,
   ContentPlanSchema,
   type PlanStep,
} from "../../schemas/plan-schema";

/**
 * Creates a structured content plan for user approval.
 * The plan will be displayed in a special UI where users can approve/skip individual steps.
 */
export const createPlanTool = createTool({
   id: "createPlan",
   description:
      "Creates a structured content plan for user approval. MUST be called after completing research to present the plan with targetKeywords, researchInsights, and suggested title/description. The user will see a UI where they can approve or skip individual steps before execution.",
   inputSchema: ContentPlanSchema,
   outputSchema: ContentPlanSchema,
   execute: async (input) => {
      // Simply return the input - the frontend will handle display
      // The tool acts as a structured way to pass plan data to the UI
      return input;
   },
});

export type CreatePlanInput = ContentPlan;
export type PlanStepInput = PlanStep;

export function getCreatePlanInstructions(): string {
   return `
## CREATE PLAN TOOL
Creates a structured content plan that the user can review and approve.

**When to use:** ALWAYS call this tool AFTER completing research with serpAnalysis, relatedKeywords, and competitorContent. This is the ONLY way to present your plan to the user.

**CRITICAL:** DO NOT write out the plan as plain text. You MUST use this tool to present the plan.

**Required Parameters:**
- summary (string): Brief 1-2 sentence summary of the plan
- steps (array): Array of step objects (1-15 steps), each with:
  - id: Unique identifier (e.g., "step-1", "step-2")
  - title: Short action title (e.g., "Write introduction section")
  - description: Detailed description of what this step will accomplish
  - toolsToUse: Array of tool names that will be used
  - rationale: Explanation of why this step matters based on research
- estimatedWordCount (number): Target word count based on competitor analysis
- targetKeywords (array): Primary and secondary keywords to target (max 10)
  - FIRST item = PRIMARY keyword (from user query)
  - Items 2-5 = HIGH relevance keywords from relatedKeywords
  - Items 6-10 = MEDIUM relevance or long-tail variations
- researchInsights (object): Research findings including:
  - serpIntent: What users are searching for
  - topRankingTopics: Key topics from competitors
  - competitorStrengths: What competitors do well
  - contentGaps: Opportunities to add unique value
  - suggestedKeywords: All discovered keywords

**Optional Parameters:**
- suggestedTitle (string): SEO-optimized title containing primary keyword (50-60 chars)
- suggestedDescription (string): Meta description with primary keyword (150-160 chars)

**Example:**
\`\`\`json
{
  "summary": "Create a comprehensive guide about React hooks based on SERP analysis",
  "estimatedWordCount": 2000,
  "targetKeywords": ["react hooks", "usestate hook", "useeffect tutorial", "react hooks examples", "custom hooks"],
  "researchInsights": {
    "serpIntent": "Users want practical examples and clear explanations of React hooks",
    "topRankingTopics": ["useState basics", "useEffect patterns", "custom hooks"],
    "competitorStrengths": ["Code examples", "Visual diagrams"],
    "contentGaps": ["Real-world use cases", "Performance tips"],
    "suggestedKeywords": ["react hooks", "usestate", "useeffect", "custom hooks", "react tutorial"]
  },
  "suggestedTitle": "React Hooks Tutorial: Master useState, useEffect & Custom Hooks",
  "suggestedDescription": "Learn React hooks with practical examples. Master useState, useEffect, and build custom hooks in this comprehensive tutorial.",
  "steps": [
    {
      "id": "step-1",
      "title": "Write introduction with primary keyword",
      "description": "Create an engaging introduction that mentions 'react hooks' in the first 100 words and explains why hooks matter",
      "toolsToUse": ["insertHeading", "insertText"],
      "rationale": "Top-ranking articles have the keyword in the first paragraph"
    }
  ]
}
\`\`\`

**User Experience:**
After you call this tool, the user will see a visual plan with checkboxes to approve or skip each step. The targetKeywords will be passed to the writer agent for use in frontmatter AND content body.
`;
}
