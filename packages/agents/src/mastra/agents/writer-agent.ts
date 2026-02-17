import { Agent } from "@mastra/core/agent";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";
// Memory tools
import { getInstructionsTool } from "../tools/memory/get-instructions-tool";
// RAG tools
import { graphSearchTool } from "../tools/rag/graph-search-tool";
import { searchPreviousContentTool } from "../tools/rag/search-previous-content-tool";

// ─── Agent instructions ──────────────────────────────────────────────────────

const getWriterAgentInstructions = (
   language: string,
   writerInstructions?: InstructionMemoryItem[],
): string => {
   const compiledMemories = compileInstructionMemories(
      writerInstructions ?? [],
   );
   const languageInstruction = buildLanguageInstruction(language);

   return `
You are an expert blog post writer. You generate complete, high-quality articles as a single markdown document.

${languageInstruction}

${compiledMemories}

## OUTPUT FORMAT

ALWAYS start your response with YAML frontmatter, followed by the full article body:

\`\`\`
---
title: "Article Title Here"
description: "1-2 sentence meta description"
slug: "article-title-here"
keywords: ["keyword1", "keyword2", "keyword3", "keyword4"]
---

# Article Title Here

Full article content here...
\`\`\`

## RULES

1. The frontmatter MUST be the very first thing in your response — no text before it
2. Use exactly this YAML format: \`title:\`, \`description:\`, \`slug:\`, \`keywords:\`
3. title and description values MUST be wrapped in double quotes
4. keywords MUST be a JSON array of strings: \`["kw1", "kw2"]\`
5. slug MUST be lowercase, hyphenated, no spaces or special chars
6. After the closing \`---\`, write the full article in markdown
7. Your final response IS the content — do not call any tools to generate or format the output. You may use search and memory tools ONLY to research the topic before writing.
8. Generate a complete, high-quality article. Not a stub. Not a summary.

## ARTICLE QUALITY STANDARDS

- Comprehensive coverage of the topic
- Clear headings hierarchy (h2 for main sections, h3 for subsections)
- Use lists, tables, code blocks where appropriate
- At least 800 words for a standard article
- Human-sounding writing, not AI-sounding
- Include a strong introduction and conclusion
- Specific examples, data points, or case studies where relevant
`;
};

// ─── Agent definition ────────────────────────────────────────────────────────

/**
 * Writer Agent
 *
 * A content writing agent that generates complete, high-quality articles as
 * a single markdown document with YAML frontmatter. Designed to run as a
 * sub-agent under the orchestrator, returning its full article as text output.
 */
export const writerAgent: Agent = new Agent({
   id: "writer-agent",
   name: "Writer Agent",
   description:
      "Escritor e editor expert de blog posts. Gera artigos completos em markdown com frontmatter YAML estruturado.",

   model: "openrouter/moonshotai/kimi-k2.5",

   instructions: ({ requestContext }) => {
      const writerInstructions = requestContext?.get("writerInstructions") as
         | InstructionMemoryItem[]
         | undefined;
      const language = (requestContext?.get("language") as string) ?? "pt-BR";
      return getWriterAgentInstructions(language, writerInstructions);
   },

   tools: {
      // RAG tools
      searchPreviousContent: searchPreviousContentTool,
      graphSearch: graphSearchTool,
      // Memory tools
      getInstructionMemories: getInstructionsTool,
   },
});
