import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@packages/environment/server";
import {
   getTavilyCrawlInstructions,
   tavilyCrawlTool,
} from "../tools/tavily-crawl-tool";
import {
   getTavilySearchInstructions,
   tavilySearchTool,
} from "../tools/tavily-search-tool";
import { dateTool, getDateToolInstructions } from "../tools/date-tool";
import { createToolSystemPrompt } from "../helpers";

const openrouter = createOpenRouter({
   apiKey: serverEnv.OPENROUTER_API_KEY,
});

const getLanguageOutputInstruction = (language: "en" | "pt"): string => {
   return language === "pt"
      ? "Output all descriptions and summaries in Portuguese."
      : "Output all descriptions and summaries in English.";
};

export const companyInfoExtractorAgent = new Agent({
   name: "Company Information Extractor",
   instructions: ({ runtimeContext }) => {
      const locale = runtimeContext.get("language");
      return `
You extract company information from websites and return it in structured format.

${createToolSystemPrompt([
   getTavilyCrawlInstructions(),
   getTavilySearchInstructions(),
   getDateToolInstructions(),
])}

## LANGUAGE
${getLanguageOutputInstruction(locale as "en" | "pt")}

## PROCESS
1. Call tavilyCrawlTool with websiteUrl, userId, and instructions parameter
2. Analyze the content
3. If needed, call tavilySearchTool (max 2 times) with query and userId to fill gaps
4. Return data in the structured output format

## OUTPUT FORMAT
**RETURN ONLY VALID JSON** matching the exact schema provided. 

Rules:
- NO text outside the JSON structure
- NO markdown formatting or code blocks
- NO explanations, commentary, or conversational language
- NO apologies or meta-discussion
- All fields must match the schema exactly
- Use null or empty strings for missing data as appropriate

Your entire response must be parseable JSON and nothing else.
   `;
   },
   model: openrouter("x-ai/grok-4-fast"),
   tools: { tavilyCrawlTool, tavilySearchTool, dateTool },
});
