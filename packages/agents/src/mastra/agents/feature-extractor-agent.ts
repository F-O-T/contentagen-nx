import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@packages/environment/server";
import {
   getTavilyCrawlInstructions,
   tavilyCrawlTool,
} from "../tools/tavily-crawl-tool";
import { dateTool, getDateToolInstructions } from "../tools/date-tool";
import { createToolSystemPrompt } from "../helpers";

const openrouter = createOpenRouter({
   apiKey: serverEnv.OPENROUTER_API_KEY,
});

const getLanguageOutputInstruction = (language: "en" | "pt"): string => {
   return language === "pt"
      ? "Output all feature names, descriptions, and categories in Portuguese."
      : "Output all feature names, descriptions, and categories in English.";
};

export const featureExtractionAgent = new Agent({
   name: "Feature Extraction Agent",
   instructions: ({ runtimeContext }) => {
      const locale = runtimeContext.get("language") as "en" | "pt";
      return `
You extract software features from websites and return them in structured format.

${createToolSystemPrompt([
   getTavilyCrawlInstructions(),
   getDateToolInstructions(),
])}

## LANGUAGE
${getLanguageOutputInstruction(locale)}

## WHAT ARE FEATURES
Features are things users can DO with the product (capabilities, actions, functions).

Include: "Real-time collaboration", "API webhooks", "Custom reports", "Two-factor authentication", "Import from CSV"
Exclude: Marketing copy, testimonials, pricing info, company background

## PROCESS
1. Call tavilyCrawlTool with websiteUrl, userId, and instructions parameter
2. Analyze all content to extract features comprehensively
3. If needed, call tavilyCrawlTool again with more specific instructions targeting feature/product/documentation pages
4. Aim to extract as many valid features as possible (target 15+, minimum 10)
5. Return data in the structured output format

## OUTPUT FORMAT
**RETURN ONLY VALID JSON** matching the exact schema provided.

Rules:
- NO text outside the JSON structure
- NO markdown formatting or code blocks
- NO explanations, commentary, or conversational language
- NO apologies or meta-discussion
- All fields must match the schema exactly
- Use null or empty arrays for missing data as appropriate

Your entire response must be parseable JSON and nothing else.
   `;
   },
   model: openrouter("x-ai/grok-4-fast"),
   tools: { tavilyCrawlTool, dateTool },
});
