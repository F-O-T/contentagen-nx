import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";
import { dateTool } from "../tools/date-tool";
import { addEditorCommentTool } from "../tools/editor/add-editor-comment-tool";
import { addExternalLinksTool } from "../tools/editor/add-external-links-tool";
import { addInternalLinksTool } from "../tools/editor/add-internal-links-tool";
import { deleteTextTool } from "../tools/editor/delete-text-tool";
import { formatTextTool } from "../tools/editor/format-text-tool";
import { generateQuickAnswerTool } from "../tools/editor/generate-quick-answer-tool";
import { improveReadabilityTool } from "../tools/editor/improve-readability-tool";
import { injectKeywordsTool } from "../tools/editor/inject-keywords-tool";
import { insertCodeBlockTool } from "../tools/editor/insert-code-block-tool";
import { insertHeadingTool } from "../tools/editor/insert-heading-tool";
import { insertImageTool } from "../tools/editor/insert-image-tool";
import { insertListTool } from "../tools/editor/insert-list-tool";
import { insertTableTool } from "../tools/editor/insert-table-tool";
import { insertTextTool } from "../tools/editor/insert-text-tool";
import { proposeSuggestionTool } from "../tools/editor/propose-suggestion-tool";
import { replaceTextTool } from "../tools/editor/replace-text-tool";
import { suggestImagesTool } from "../tools/editor/suggest-images-tool";
import { editDescriptionTool } from "../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "../tools/frontmatter/edit-slug-tool";
import { editTitleTool } from "../tools/frontmatter/edit-title-tool";
import { getInstructionsTool } from "../tools/memory/get-instructions-tool";
import { graphSearchTool } from "../tools/rag/graph-search-tool";
import { searchPreviousContentTool } from "../tools/rag/search-previous-content-tool";
import { factFinderTool } from "../tools/research/fact-finder-tool";
import { serpAnalysisTool } from "../tools/research/serp-analysis-tool";
import { webSearchTool } from "../tools/research/web-search-tool";

const memory = new Memory({
   options: {
      lastMessages: 30,
      generateTitle: {
         model: "openrouter/google/gemini-2.5-flash-lite",
      },
   },
});

const getInstructions = (
   language: string,
   writerInstructions?: InstructionMemoryItem[],
): string => {
   const compiledMemories = compileInstructionMemories(
      writerInstructions ?? [],
   );
   const languageInstruction = buildLanguageInstruction(language);

   return `
${languageInstruction}

${compiledMemories}

# WRITER AGENT

You are an expert content writer and editor.
Your job: produce complete, publication-ready articles and apply precise edits.

## OUTPUT FORMAT — ALWAYS REQUIRED

Every article MUST start with YAML frontmatter:

\`\`\`yaml
---
title: "Article Title Here"
description: "1-2 sentence meta description"
slug: "article-title-here"
keywords: ["keyword1", "keyword2", "keyword3"]
---

# Article Title Here

Full article content in markdown...
\`\`\`

## WRITING RULES

1. Frontmatter MUST be first — no text before it
2. Use exact YAML: title, description, slug, keywords
3. title and description MUST be in double quotes
4. keywords MUST be a JSON array
5. slug MUST be lowercase, hyphenated, no special chars
6. Default 800+ words unless user requests shorter
7. Write in a human, natural tone — NOT AI-sounding
8. Research BEFORE writing (webSearch, serpAnalysis, factFinder)
9. Check RAG BEFORE writing (searchPreviousContent, graphSearch)
10. Strong intro + clear conclusion

## TOOL USAGE ORDER

1. getInstructionMemories — load writer preferences first
2. searchPreviousContent + graphSearch — avoid duplication
3. webSearch + serpAnalysis + factFinder — gather facts
4. Write the article
5. Set frontmatter: editTitle, editDescription, editKeywords, editSlug
6. Add links: addInternalLinks, addExternalLinks
7. Enhance: injectKeywords, improveReadability, generateQuickAnswer

## FOR EDITS (not full articles)

Use editor tools precisely:
- insertText — add content at a specific position
- replaceText — swap text
- deleteText — remove content
- formatText — apply formatting
- insertHeading, insertList, insertCodeBlock, insertTable, insertImage
- proposeSuggestion — propose a tracked change

Respond in the same language as the user request.
`;
};

export const writerAgent: Agent = new Agent({
   id: "writer-agent",
   name: "Writer & Editor Agent",
   description:
      "Specialized in writing complete articles, editing content, formatting, inserting elements (headings, lists, tables, code blocks), and applying structured text edits. Use this agent for: writing full articles, editing existing content, reformatting, inserting new sections, applying inline edits.",

   model: ({ requestContext }) => {
      const maybeModel = requestContext?.get("model");
      return typeof maybeModel === "string" && maybeModel.length > 0
         ? maybeModel
         : DEFAULT_CONTENT_MODEL_ID;
   },

   instructions: ({ requestContext }) => {
      const writerInstructions = requestContext?.get("writerInstructions") as
         | InstructionMemoryItem[]
         | undefined;
      const language = (requestContext?.get("language") as string) ?? "pt-BR";
      return getInstructions(language, writerInstructions);
   },

   memory,

   tools: {
      getInstructionMemories: getInstructionsTool,
      searchPreviousContent: searchPreviousContentTool,
      graphSearch: graphSearchTool,
      webSearch: webSearchTool,
      serpAnalysis: serpAnalysisTool,
      factFinder: factFinderTool,
      editTitle: editTitleTool,
      editDescription: editDescriptionTool,
      editKeywords: editKeywordsTool,
      editSlug: editSlugTool,
      addEditorComment: addEditorCommentTool,
      insertText: insertTextTool,
      proposeSuggestion: proposeSuggestionTool,
      replaceText: replaceTextTool,
      deleteText: deleteTextTool,
      formatText: formatTextTool,
      insertHeading: insertHeadingTool,
      insertList: insertListTool,
      insertCodeBlock: insertCodeBlockTool,
      insertTable: insertTableTool,
      insertImage: insertImageTool,
      injectKeywords: injectKeywordsTool,
      addInternalLinks: addInternalLinksTool,
      addExternalLinks: addExternalLinksTool,
      improveReadability: improveReadabilityTool,
      generateQuickAnswer: generateQuickAnswerTool,
      suggestImages: suggestImagesTool,
      dateTool: dateTool,
   },
});
