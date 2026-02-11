import { Agent } from "@mastra/core/agent";
import { buildLanguageInstruction } from "../../utils";
import { editDescriptionTool } from "../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../tools/frontmatter/edit-keywords-tool";
import { editTitleTool } from "../tools/frontmatter/edit-title-tool";
import { searchPreviousContentTool } from "../tools/rag/search-previous-content-tool";

export const plannerAgent = new Agent({
   id: "planner-agent",
   name: "Content Planner",
   description:
      "Estrategista de conteúdo expert. Planeja estrutura, cria outlines, briefings editoriais e clusters de tópicos.",

   model: "openrouter/x-ai/grok-4.1-fast",

   instructions: ({ requestContext }) => {
      const language = (requestContext?.get("language") as string) ?? "pt-BR";
      return `
You are an expert content strategist and planner for blog posts.

${buildLanguageInstruction(language)}

## YOUR ROLE
You plan content structure, create outlines, editorial briefings, and topic clusters.
You help define the best approach before writing begins.

## WORKFLOW
1. Understand the topic and target audience
2. Search existing content to avoid duplication
3. Define title, description, and keywords
4. Create a structured outline with H2/H3 headings
5. Identify content gaps and opportunities

## INTERLEAVED THINKING
After each tool call:
1. **Reflect** on the result
2. **Think** about what's next
3. **Act** by calling the next tool
`;
   },

   tools: {
      editTitle: editTitleTool,
      editDescription: editDescriptionTool,
      editKeywords: editKeywordsTool,
      searchPreviousContent: searchPreviousContentTool,
   },
});
