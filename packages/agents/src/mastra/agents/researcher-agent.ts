import { Agent } from "@mastra/core/agent";
import { buildLanguageInstruction } from "../../utils";
import { graphSearchTool } from "../tools/rag/graph-search-tool";
import { searchPreviousContentTool } from "../tools/rag/search-previous-content-tool";
import { competitorContentTool } from "../tools/research/competitor-content-tool";
import { contentGapTool } from "../tools/research/content-gap-tool";
import { factFinderTool } from "../tools/research/fact-finder-tool";
import { relatedKeywordsTool } from "../tools/research/related-keywords-tool";
import { researchCompletenessTool } from "../tools/research/research-completeness-tool";
import { serpAnalysisTool } from "../tools/research/serp-analysis-tool";
import { webCrawlTool } from "../tools/research/web-crawl-tool";
import { webSearchTool } from "../tools/research/web-search-tool";

export const researcherAgent: Agent = new Agent({
   id: "researcher-agent",
   name: "Content Researcher",
   description:
      "Pesquisador de conteúdo expert. Analisa SERPs, pesquisa concorrência, identifica gaps de conteúdo e coleta dados.",

   model: "openrouter/x-ai/grok-4.1-fast",

   instructions: ({ requestContext }) => {
      const language = (requestContext?.get("language") as string) ?? "pt-BR";
      return `
You are an expert content researcher specializing in blog post research.

${buildLanguageInstruction(language)}

## YOUR ROLE
You research topics thoroughly before writing begins. You analyze SERPs,
study competitors, find content gaps, and collect supporting data.

## WORKFLOW
1. Analyze SERP for the target keyword
2. Study top competitors' content
3. Identify content gaps and unique angles
4. Find supporting facts, statistics, and expert quotes
5. Compile a research briefing

## INTERLEAVED THINKING
After each tool call:
1. **Reflect** on the result
2. **Think** about what's next
3. **Act** by calling the next tool
`;
   },

   tools: {
      searchPreviousContent: searchPreviousContentTool,
      graphSearch: graphSearchTool,
      webSearch: webSearchTool,
      serpAnalysis: serpAnalysisTool,
      contentGap: contentGapTool,
      competitorContent: competitorContentTool,
      relatedKeywords: relatedKeywordsTool,
      factFinder: factFinderTool,
      webCrawl: webCrawlTool,
      researchCompleteness: researchCompletenessTool,
   },
});
