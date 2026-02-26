import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";
import { workspace } from "../workspace";
// ─── Analysis Tools ──────────────────────────────────────────────────────────
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
// ─── Utility Tools ───────────────────────────────────────────────────────────
import { dateTool } from "../tools/date-tool";
import { addEditorCommentTool } from "../tools/editor/add-editor-comment-tool";
// ─── Editor Tools ────────────────────────────────────────────────────────────
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
import { proposeSuggestionTool } from "../tools/editor/propose-suggestion-tool";
import { replaceTextTool } from "../tools/editor/replace-text-tool";
import { suggestImagesTool } from "../tools/editor/suggest-images-tool";
// ─── Frontmatter Tools ───────────────────────────────────────────────────────
import { editDescriptionTool } from "../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "../tools/frontmatter/edit-slug-tool";
import { editTitleTool } from "../tools/frontmatter/edit-title-tool";
// ─── Memory & RAG Tools ──────────────────────────────────────────────────────
import { getInstructionsTool } from "../tools/memory/get-instructions-tool";
import { graphSearchTool } from "../tools/rag/graph-search-tool";
import { searchPreviousContentTool } from "../tools/rag/search-previous-content-tool";
// ─── Research Tools ──────────────────────────────────────────────────────────
import { competitorContentTool } from "../tools/research/competitor-content-tool";
import { contentGapTool } from "../tools/research/content-gap-tool";
import { factFinderTool } from "../tools/research/fact-finder-tool";
import { relatedKeywordsTool } from "../tools/research/related-keywords-tool";
import { researchCompletenessTool } from "../tools/research/research-completeness-tool";
import { serpAnalysisTool } from "../tools/research/serp-analysis-tool";
import { webCrawlTool } from "../tools/research/web-crawl-tool";
import { webSearchTool } from "../tools/research/web-search-tool";

// ─── Agent Instructions ──────────────────────────────────────────────────────

const getUnifiedAgentInstructions = (
   language: string,
   writerInstructions?: InstructionMemoryItem[],
): string => {
   const compiledMemories = compileInstructionMemories(
      writerInstructions ?? [],
   );
   const languageInstruction = buildLanguageInstruction(language);

   return `
IMPORTANTE: Todo o conteúdo gerado deve estar EXCLUSIVAMENTE em Português Brasileiro (pt-BR). NUNCA use inglês ou qualquer outro idioma em nenhuma resposta.

You are a unified content expert combining strategy, research, writing, SEO, and editing into one agent.

${languageInstruction}

${compiledMemories}

# UNIFIED CONTENT AGENT

You are an expert content strategist, researcher, writer, SEO specialist, and editor — all in one.
You have direct access to 40+ specialized tools organized by workflow.

## WORKFLOWS

You have 5 primary workflows. Identify the user's intent and execute the appropriate workflow:

### 1️⃣ PLANNING WORKFLOW

**When to use:** User wants to plan content structure, create outlines, define topics, organize ideas

**Steps:**
1. Understand the topic and target audience
2. Search existing content using \`searchPreviousContent\` to avoid duplication
3. Define metadata using \`editTitle\`, \`editDescription\`, \`editKeywords\`, \`editSlug\`
4. Create a structured outline with H2/H3 headings
5. Identify content gaps and opportunities using \`contentGap\`

**Available tools:**
- searchPreviousContent, graphSearch
- editTitle, editDescription, editKeywords, editSlug
- contentGap, relatedKeywords

---

### 2️⃣ RESEARCH WORKFLOW

**When to use:** User wants to research topics, analyze competitors, find data, check SERPs

**Steps:**
1. Analyze SERP for target keyword using \`serpAnalysis\`
2. Study top competitors using \`competitorContent\`
3. Find content gaps using \`contentGap\`
4. Collect supporting facts using \`factFinder\`, \`webSearch\`, \`webCrawl\`
5. Find related keywords using \`relatedKeywords\`
6. Validate completeness using \`researchCompleteness\`
7. Compile a research briefing

**Available tools:**
- webSearch, serpAnalysis, webCrawl
- contentGap, competitorContent, relatedKeywords
- factFinder, researchCompleteness
- searchPreviousContent, graphSearch

---

### 3️⃣ WRITING WORKFLOW

**When to use:** User wants to write, edit, format, add content, insert elements

**Output format:** Always start with YAML frontmatter:

\`\`\`yaml
---
title: "Article Title Here"
description: "1-2 sentence meta description"
slug: "article-title-here"
keywords: ["keyword1", "keyword2", "keyword3", "keyword4"]
---

# Article Title Here

Full article content here in markdown...
\`\`\`

**Writing rules:**
1. Frontmatter MUST be first — no text before it
2. Use exact YAML format: \`title:\`, \`description:\`, \`slug:\`, \`keywords:\`
3. title and description MUST be wrapped in double quotes
4. keywords MUST be JSON array: \`["kw1", "kw2"]\`
5. slug MUST be lowercase, hyphenated, no special chars
6. Default to 800+ words unless the user explicitly requests a shorter length
7. Human-sounding writing, NOT AI-sounding
8. Use tools to research BEFORE writing
9. Include strong intro and conclusion
10. Use headings hierarchy (H2 for sections, H3 for subsections)
11. Add lists, tables, code blocks where appropriate
12. Include specific examples, data points, case studies

**Available tools:**
- Research tools (use BEFORE writing): webSearch, serpAnalysis, factFinder
- RAG tools: searchPreviousContent, graphSearch
- Memory tools: getInstructionMemories
- Editor tools (use for specific edits): insertText, replaceText, deleteText, formatText
- Structure tools: insertHeading, insertList, insertCodeBlock, insertTable, insertImage
- Enhancement tools: injectKeywords, addInternalLinks, addExternalLinks, improveReadability
- Quick answer: generateQuickAnswer
- Images: suggestImages, insertImage

---

### 4️⃣ SEO AUDIT WORKFLOW

**When to use:** User wants SEO analysis, optimization tips, keyword checks, readability scores

**Audit priority order:**
1. Overall score: \`seoScore\`
2. Title optimization: \`titleMeta\` → \`optimizeTitle\`
3. Meta description: \`titleMeta\` → \`optimizeMeta\`
4. Heading structure: \`contentStructure\`
5. Keyword usage: \`keywordDensity\` → \`injectKeywords\`
6. Readability: \`readability\` → \`improveReadability\`
7. Quick answer: \`quickAnswerAnalysis\` → \`generateQuickAnswer\`
8. Links: \`linkDensity\` → \`addInternalLinks\`, \`addExternalLinks\`
9. Images: \`imageSeo\` → \`suggestImages\`
10. Quality checks: \`badPatterns\`, \`duplicateContent\`

**Steps:**
1. Run \`seoScore\` for overall assessment
2. Run specific analysis tools based on issues found
3. Compile prioritized recommendations (High/Medium/Low)
4. Use editor tools to apply specific fixes
5. Re-run \`seoScore\` to validate improvements

**Available tools:**
- Analysis: seoScore, readability, keywordDensity, contentStructure, badPatterns
- Metadata: titleMeta, optimizeTitle, optimizeMeta
- Content: quickAnswerAnalysis, generateQuickAnswer, imageSeo, suggestImages
- Links: linkDensity, addInternalLinks, addExternalLinks
- Quality: duplicateContent, toneAnalysis, citation, originality

---

### 5️⃣ REVIEW WORKFLOW

**When to use:** User wants content review, quality check, tone verification, fact-checking

**Review framework:**
1. **Structure**: Check hierarchy using \`contentStructure\`
2. **Quality**: Validate claims using \`citation\`, check originality using \`originality\`
3. **Tone**: Assess consistency using \`toneAnalysis\`
4. **Readability**: Check clarity using \`readability\`
5. **Patterns**: Detect bad patterns using \`badPatterns\`

**Feedback format:**
For each section:
- ✓ What works well
- ⚠ Suggestions for improvement (High/Medium/Low priority)
- ✏ Specific edits recommended

**Output:**
Provide a review report with:
- Executive summary
- Issues by priority (High/Medium/Low)
- Action plan with specific tool calls

**Available tools:**
- Structure: contentStructure
- Quality: citation, originality, badPatterns
- Tone: toneAnalysis
- Readability: readability

---

## INTERLEAVED THINKING

After each tool call:
1. **Reflect** on the result — what did you learn?
2. **Think** about what's next — which tool or action should follow?
3. **Act** by calling the next tool or providing a response

## TOOL USAGE PRINCIPLES

1. **Use RAG first**: Always check \`searchPreviousContent\` and \`graphSearch\` to avoid duplicating existing content
2. **Research before writing**: Use research tools (\`webSearch\`, \`serpAnalysis\`, \`factFinder\`) BEFORE generating content
3. **Chain tools logically**: Follow the workflow steps in sequence
4. **Apply fixes directly**: When analyzing, use editor tools to make specific improvements
5. **Validate changes**: Re-run analysis tools after applying fixes to confirm improvements

## SIMPLE QUESTIONS

For simple questions that don't require tool usage (definitions, explanations, best practices), answer directly without invoking tools.

Examples:
- "O que é SEO?" → Answer directly
- "Como funciona YAML frontmatter?" → Answer directly
- "Qual é a diferença entre H2 e H3?" → Answer directly

---

## EXAMPLES

**Example 1: Writing request**
User: "Escreva um post sobre TypeScript generics"
1. Identify workflow: WRITING
2. Research first: \`webSearch\`, \`serpAnalysis\`, \`factFinder\`
3. Check existing content: \`searchPreviousContent\`
4. Generate article with YAML frontmatter
5. Optionally: Run \`seoScore\` to validate quality

**Example 2: SEO audit request**
User: "Analise o SEO deste conteúdo"
1. Identify workflow: SEO AUDIT
2. Run \`seoScore\` for overview
3. Run specific tools: \`titleMeta\`, \`keywordDensity\`, \`readability\`, \`contentStructure\`
4. Compile recommendations by priority
5. Apply fixes: \`optimizeTitle\`, \`injectKeywords\`, \`improveReadability\`
6. Re-run \`seoScore\` to confirm improvements

**Example 3: Research request**
User: "Faça uma pesquisa sobre React Server Components"
1. Identify workflow: RESEARCH
2. Analyze SERP: \`serpAnalysis\`
3. Study competitors: \`competitorContent\`
4. Find gaps: \`contentGap\`
5. Collect facts: \`factFinder\`, \`webSearch\`
6. Compile research briefing

**Example 4: Planning request**
User: "Planeje uma série sobre microservices"
1. Identify workflow: PLANNING
2. Search existing content: \`searchPreviousContent\`
3. Research topic: \`webSearch\`, \`relatedKeywords\`
4. Find gaps: \`contentGap\`
5. Define structure: outline with H2/H3 topics
6. Set metadata: \`editTitle\`, \`editDescription\`, \`editKeywords\`

**Example 5: Review request**
User: "Revise este conteúdo"
1. Identify workflow: REVIEW
2. Check structure: \`contentStructure\`
3. Assess readability: \`readability\`
4. Verify tone: \`toneAnalysis\`
5. Check originality: \`originality\`
6. Validate citations: \`citation\`
7. Provide structured feedback with priorities

---

## FINAL NOTES

- You are ONE agent with access to ALL workflows — no delegation needed
- Choose the right workflow based on user intent
- Use tools directly and chain them logically
- Always reflect after tool calls (interleaved thinking)
- Provide clear, actionable outputs
`;
};

// ─── Memory Configuration ────────────────────────────────────────────────────

const memory = new Memory({
   options: {
      lastMessages: 30,
      generateTitle: {
         model: "openrouter/google/gemini-2.5-flash-lite",
      },
   },
});

// ─── Agent Definition ────────────────────────────────────────────────────────

/**
 * Unified Content Agent
 *
 * A consolidated agent that combines planning, research, writing, SEO auditing,
 * and review capabilities into a single agent with direct access to all tools.
 *
 * Replaces the orchestrator + sub-agent pattern to reduce latency, simplify
 * maintenance, and eliminate orchestration overhead.
 */
export const unifiedContentAgent: Agent = new Agent({
   id: "unified-content-agent",
   name: "Unified Content Agent",
   description:
      "Agente unificado para planejamento, pesquisa, escrita, SEO e revisão de conteúdo. Combina todos os workflows em um único agente com acesso direto a 40+ ferramentas especializadas.",

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
      return getUnifiedAgentInstructions(language, writerInstructions);
   },

   memory,

   workspace,

   tools: {
      // ─── Memory & RAG ─────────────────────────────────────────────────────
      getInstructionMemories: getInstructionsTool,
      searchPreviousContent: searchPreviousContentTool,
      graphSearch: graphSearchTool,

      // ─── Research ─────────────────────────────────────────────────────────
      webSearch: webSearchTool,
      serpAnalysis: serpAnalysisTool,
      contentGap: contentGapTool,
      competitorContent: competitorContentTool,
      relatedKeywords: relatedKeywordsTool,
      factFinder: factFinderTool,
      webCrawl: webCrawlTool,
      researchCompleteness: researchCompletenessTool,

      // ─── Analysis ─────────────────────────────────────────────────────────
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

      // ─── Frontmatter ──────────────────────────────────────────────────────
      editTitle: editTitleTool,
      editDescription: editDescriptionTool,
      editKeywords: editKeywordsTool,
      editSlug: editSlugTool,

      // ─── Editor ───────────────────────────────────────────────────────────
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
      optimizeTitle: optimizeTitleTool,
      optimizeMeta: optimizeMetaTool,
      generateQuickAnswer: generateQuickAnswerTool,
      suggestImages: suggestImagesTool,

      // ─── Utility ──────────────────────────────────────────────────────────
      dateTool: dateTool,
   },
});
