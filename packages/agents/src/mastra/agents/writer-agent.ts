import { Agent } from "@mastra/core/agent";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";
// Analysis tools
import { badPatternTool } from "../tools/analysis/bad-pattern-tool";
import { citationTool } from "../tools/analysis/citation-tool";
import { contentStructureTool } from "../tools/analysis/content-structure-tool";
import { duplicateContentTool } from "../tools/analysis/duplicate-content-tool";
import { imageSeoTool } from "../tools/analysis/image-seo-tool";
import { keywordDensityTool } from "../tools/analysis/keyword-density-tool";
import { linkDensityTool } from "../tools/analysis/link-density-tool";
import { originalityTool } from "../tools/analysis/originality-tool";
import { quickAnswerAnalysisTool } from "../tools/analysis/quick-answer-tool";
import { readabilityTool } from "../tools/analysis/readability-tool";
import { seoScoreTool } from "../tools/analysis/seo-score-tool";
import { titleMetaTool } from "../tools/analysis/title-meta-tool";
import { toneAnalysisTool } from "../tools/analysis/tone-analysis-tool";
// Editor tools
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
import { optimizeMetaTool } from "../tools/editor/optimize-meta-tool";
import { optimizeTitleTool } from "../tools/editor/optimize-title-tool";
import { replaceTextTool } from "../tools/editor/replace-text-tool";
import { suggestImagesTool } from "../tools/editor/suggest-images-tool";
// Frontmatter tools
import { editDescriptionTool } from "../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "../tools/frontmatter/edit-slug-tool";
import { editTitleTool } from "../tools/frontmatter/edit-title-tool";
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
You are an expert blog post writer and editor. You write and edit content directly using markdown in a Lexical rich text editor.

${languageInstruction}

${compiledMemories}

## FIRST STEPS - ALWAYS DO THIS
Before starting ANY writing task:
1. Set frontmatter first (editTitle, editDescription, editSlug, editKeywords)
2. Write or edit content using editor tools

## YOUR ROLE
You are a markdown content writer. You make edits directly using tools, thinking step-by-step.

## INTERLEAVED THINKING
After each tool call:
1. **Reflect** on the result
2. **Think** about what's next
3. **Act** by calling the next tool
`;
};

// ─── Agent definition ────────────────────────────────────────────────────────

/**
 * Writer Agent
 *
 * A content writing agent for editing blog posts with tools for:
 * - Text manipulation (insert, replace, delete, format)
 * - Structure (headings, lists, code blocks, tables, images)
 * - Frontmatter (title, description, slug, keywords)
 * - Analysis (SEO, readability, keyword density)
 *
 * Deep knowledge comes from Mastra Skills (edicao-de-conteudo, gestao-de-frontmatter,
 * diretrizes-de-escrita, otimizacao-seo, escrita-humana, etc.)
 */
export const writerAgent = new Agent({
   id: "writer-agent",
   name: "Writer Agent",
   description:
      "Escritor e editor expert de blog posts. Escreve, edita e otimiza conteúdo usando ferramentas markdown em um editor rich text.",

   model: "openrouter/x-ai/grok-4.1-fast",

   instructions: ({ requestContext }) => {
      const writerInstructions = requestContext?.get("writerInstructions") as
         | InstructionMemoryItem[]
         | undefined;
      const language = (requestContext?.get("language") as string) ?? "pt-BR";
      return getWriterAgentInstructions(language, writerInstructions);
   },

   tools: {
      // Editor tools
      insertText: insertTextTool,
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
      improveReadability: improveReadabilityTool,
      optimizeTitle: optimizeTitleTool,
      optimizeMeta: optimizeMetaTool,
      generateQuickAnswer: generateQuickAnswerTool,
      suggestImages: suggestImagesTool,
      addExternalLinks: addExternalLinksTool,
      // Frontmatter tools
      editTitle: editTitleTool,
      editDescription: editDescriptionTool,
      editSlug: editSlugTool,
      editKeywords: editKeywordsTool,
      // Analysis tools
      seoScore: seoScoreTool,
      readability: readabilityTool,
      keywordDensity: keywordDensityTool,
      contentStructure: contentStructureTool,
      badPatterns: badPatternTool,
      titleMeta: titleMetaTool,
      quickAnswerAnalysis: quickAnswerAnalysisTool,
      imageSeo: imageSeoTool,
      linkDensity: linkDensityTool,
      duplicateContent: duplicateContentTool,
      toneAnalysis: toneAnalysisTool,
      citation: citationTool,
      originality: originalityTool,
      // RAG tools
      searchPreviousContent: searchPreviousContentTool,
      graphSearch: graphSearchTool,
      // Memory tools
      getInstructionMemories: getInstructionsTool,
   },
});
