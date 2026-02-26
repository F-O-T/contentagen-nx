# Agent Networks: Monolith to Specialized Network Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the monolithic `unifiedContentAgent` into a Mastra agent network where a lightweight router agent orchestrates four specialized sub-agents (researcher, writer, SEO auditor, reviewer), while preserving the existing public API surface (`mastra.getAgent("unifiedContent")`, `createRequestContext`, all tool call streaming in oRPC routers) completely unchanged.

**Architecture:** A new `contentNetworkAgent` (router) is registered under the existing `"unifiedContent"` key in Mastra. The router receives a task, chooses the best sub-agent via Mastra's native `.network()` call (which is already built into `Agent`), and delegates. Each sub-agent carries only the tools it needs (≤15), which reduces context window overhead and improves focus. The existing `unifiedContentAgent` is kept intact and renamed to a fallback, so the rollout is safe and incremental.

**Tech Stack:** Mastra `@mastra/core` (Agent class with native `agents` config + `.network()` method), TypeScript, Bun, Nx monorepo. No new npm packages needed — `network()` is already in the installed version of `@mastra/core`.

---

## Context: How Mastra Agent Networks Work

From the embedded type definitions at `node_modules/@mastra/core/dist/agent/types.d.ts`:

```typescript
// AgentConfig has an `agents` field:
agents?: DynamicArgument<Record<string, Agent>>;

// Agent class has a .network() method:
network(messages: MessageListInput, options?: NetworkOptions): Promise<MastraAgentNetworkStream>
```

The router agent gets the sub-agents configured via `agents` in its `AgentConfig`. When `.network()` is called, Mastra's internal loop routes each iteration to the appropriate sub-agent. The router itself does NOT need tools — it reads the sub-agents' capabilities from their descriptions and delegates.

**Key facts:**
- `.network()` returns a `MastraAgentNetworkStream extends ReadableStream<ChunkType>` — not the same as `.stream()` which returns `MastraModelOutput`
- The current oRPC router `aiCommandStream` uses `.stream()` and iterates `result.fullStream` — for the network, we switch to `.network()` and iterate its readable stream
- `createRequestContext` and the public API stay identical
- All 5 existing workflows (planning, research, writing, SEO audit, review) map cleanly to 4 specialized agents (planning+writing combined since they share most tools)

---

## File Map

```
packages/agents/src/mastra/
├── agents/
│   ├── unified-content-agent.ts          ← RENAME to content-fallback-agent.ts (keep as-is)
│   ├── content-network-agent.ts          ← NEW: router agent (replaces unified-content-agent.ts)
│   ├── specialized/
│   │   ├── research-agent.ts             ← NEW: research + planning tools
│   │   ├── writer-agent.ts               ← NEW: writing + editor tools
│   │   ├── seo-auditor-agent.ts          ← NEW: analysis + frontmatter tools
│   │   └── reviewer-agent.ts             ← NEW: review + quality tools
│   ├── fim-agent.ts                      ← unchanged
│   └── inline-edit-agent.ts              ← unchanged
└── index.ts                              ← MODIFY: swap "unifiedContent" → contentNetworkAgent
```

---

## Task 1: Create the Research Agent

The research agent handles the RESEARCH workflow (web search, SERP, competitor, facts, keywords, gaps) and the PLANNING workflow (content gaps, related keywords, previous content, graph search).

**Files:**
- Create: `packages/agents/src/mastra/agents/specialized/research-agent.ts`

**Step 1: Create the file**

```typescript
// packages/agents/src/mastra/agents/specialized/research-agent.ts
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../../utils";
import { contentGapTool } from "../../tools/research/content-gap-tool";
import { competitorContentTool } from "../../tools/research/competitor-content-tool";
import { factFinderTool } from "../../tools/research/fact-finder-tool";
import { relatedKeywordsTool } from "../../tools/research/related-keywords-tool";
import { researchCompletenessTool } from "../../tools/research/research-completeness-tool";
import { serpAnalysisTool } from "../../tools/research/serp-analysis-tool";
import { webCrawlTool } from "../../tools/research/web-crawl-tool";
import { webSearchTool } from "../../tools/research/web-search-tool";
import { getInstructionsTool } from "../../tools/memory/get-instructions-tool";
import { graphSearchTool } from "../../tools/rag/graph-search-tool";
import { searchPreviousContentTool } from "../../tools/rag/search-previous-content-tool";
import { editTitleTool } from "../../tools/frontmatter/edit-title-tool";
import { editDescriptionTool } from "../../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../../tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "../../tools/frontmatter/edit-slug-tool";
import { dateTool } from "../../tools/date-tool";

const memory = new Memory({
   options: {
      lastMessages: 20,
      generateTitle: {
         model: "openrouter/google/gemini-2.5-flash-lite",
      },
   },
});

const getInstructions = (
   language: string,
   writerInstructions?: InstructionMemoryItem[],
): string => {
   const compiledMemories = compileInstructionMemories(writerInstructions ?? []);
   const languageInstruction = buildLanguageInstruction(language);

   return `
${languageInstruction}

${compiledMemories}

# RESEARCH & PLANNING AGENT

You are an expert content researcher and strategist.
Your job: gather intelligence, plan content structure, and deliver rich research briefings.

## YOUR TOOLS

**Research:**
- webSearch — broad topic research
- serpAnalysis — SERP landscape for a keyword
- competitorContent — what top competitors cover
- contentGap — gaps competitors miss
- relatedKeywords — keyword clusters
- factFinder — specific statistics and data points
- webCrawl — deep-dive crawl of a specific URL
- researchCompleteness — validate you've been thorough

**Memory & RAG:**
- getInstructionMemories — load writer preferences
- searchPreviousContent — avoid duplicating published content
- graphSearch — semantic knowledge graph lookup

**Planning (Frontmatter):**
- editTitle, editDescription, editKeywords, editSlug — set content metadata

## PLANNING WORKFLOW

When asked to plan content:
1. searchPreviousContent — check existing coverage
2. webSearch + serpAnalysis — understand the landscape
3. contentGap — find angles competitors miss
4. relatedKeywords — build keyword clusters
5. Set frontmatter: editTitle, editDescription, editKeywords, editSlug
6. Deliver a structured outline (H2/H3 hierarchy)

## RESEARCH WORKFLOW

When asked to research a topic:
1. serpAnalysis — top-10 SERP analysis
2. competitorContent — what's working for top competitors
3. contentGap — what they miss
4. factFinder + webSearch — supporting data
5. researchCompleteness — validate thoroughness
6. Deliver a research briefing with sources

## OUTPUT FORMAT

Always produce a structured briefing:
- Executive summary (2-3 sentences)
- Key findings (bullet points with sources)
- Keyword strategy
- Recommended content structure
- Gaps and opportunities

Respond in the same language as the user request.
`;
};

export const researchAgent: Agent = new Agent({
   id: "research-agent",
   name: "Research & Planning Agent",
   description:
      "Specialized in content research, SERP analysis, competitor analysis, keyword research, content gaps, and content planning. Use this agent for: researching topics, planning content structure, analyzing competitors, finding keyword opportunities, and building research briefings.",

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
      contentGap: contentGapTool,
      competitorContent: competitorContentTool,
      relatedKeywords: relatedKeywordsTool,
      factFinder: factFinderTool,
      webCrawl: webCrawlTool,
      researchCompleteness: researchCompletenessTool,
      editTitle: editTitleTool,
      editDescription: editDescriptionTool,
      editKeywords: editKeywordsTool,
      editSlug: editSlugTool,
      dateTool: dateTool,
   },
});
```

**Step 2: Verify TypeScript compiles**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep -E "error|Error" | head -20
```

Expected: No errors in `packages/agents/src/mastra/agents/specialized/research-agent.ts`

**Step 3: Commit**

```bash
cd /home/yorizel/Documents/contentta-nx
git add packages/agents/src/mastra/agents/specialized/research-agent.ts
git commit -m "feat(agents): add specialized research & planning agent"
```

---

## Task 2: Create the Writer Agent

The writer agent handles the WRITING workflow — the heaviest agent with all editor tools.

**Files:**
- Create: `packages/agents/src/mastra/agents/specialized/writer-agent.ts`

**Step 1: Create the file**

```typescript
// packages/agents/src/mastra/agents/specialized/writer-agent.ts
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../../utils";
import { getInstructionsTool } from "../../tools/memory/get-instructions-tool";
import { graphSearchTool } from "../../tools/rag/graph-search-tool";
import { searchPreviousContentTool } from "../../tools/rag/search-previous-content-tool";
import { webSearchTool } from "../../tools/research/web-search-tool";
import { serpAnalysisTool } from "../../tools/research/serp-analysis-tool";
import { factFinderTool } from "../../tools/research/fact-finder-tool";
import { editTitleTool } from "../../tools/frontmatter/edit-title-tool";
import { editDescriptionTool } from "../../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../../tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "../../tools/frontmatter/edit-slug-tool";
import { addEditorCommentTool } from "../../tools/editor/add-editor-comment-tool";
import { insertTextTool } from "../../tools/editor/insert-text-tool";
import { replaceTextTool } from "../../tools/editor/replace-text-tool";
import { deleteTextTool } from "../../tools/editor/delete-text-tool";
import { formatTextTool } from "../../tools/editor/format-text-tool";
import { insertHeadingTool } from "../../tools/editor/insert-heading-tool";
import { insertListTool } from "../../tools/editor/insert-list-tool";
import { insertCodeBlockTool } from "../../tools/editor/insert-code-block-tool";
import { insertTableTool } from "../../tools/editor/insert-table-tool";
import { insertImageTool } from "../../tools/editor/insert-image-tool";
import { injectKeywordsTool } from "../../tools/editor/inject-keywords-tool";
import { addInternalLinksTool } from "../../tools/editor/add-internal-links-tool";
import { addExternalLinksTool } from "../../tools/editor/add-external-links-tool";
import { improveReadabilityTool } from "../../tools/editor/improve-readability-tool";
import { generateQuickAnswerTool } from "../../tools/editor/generate-quick-answer-tool";
import { suggestImagesTool } from "../../tools/editor/suggest-images-tool";
import { proposeSuggestionTool } from "../../tools/editor/propose-suggestion-tool";
import { dateTool } from "../../tools/date-tool";

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
   const compiledMemories = compileInstructionMemories(writerInstructions ?? []);
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
```

**Step 2: Verify TypeScript**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep -E "error|Error" | head -20
```

Expected: No new errors.

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/agents/specialized/writer-agent.ts
git commit -m "feat(agents): add specialized writer & editor agent"
```

---

## Task 3: Create the SEO Auditor Agent

The SEO auditor agent handles the SEO AUDIT workflow — all analysis and optimization tools.

**Files:**
- Create: `packages/agents/src/mastra/agents/specialized/seo-auditor-agent.ts`

**Step 1: Create the file**

```typescript
// packages/agents/src/mastra/agents/specialized/seo-auditor-agent.ts
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../../utils";
import { badPatternTool } from "../../tools/analysis/bad-pattern-tool";
import { citationTool } from "../../tools/analysis/citation-tool";
import { contentStructureTool } from "../../tools/analysis/content-structure-tool";
import { duplicateContentTool } from "../../tools/analysis/duplicate-content-tool";
import { imageSeoTool } from "../../tools/analysis/image-seo-tool";
import { keywordDensityTool } from "../../tools/analysis/keyword-density-tool";
import { linkDensityTool } from "../../tools/analysis/link-density-tool";
import { originalityTool } from "../../tools/analysis/originality-tool";
import { quickAnswerAnalysisTool } from "../../tools/analysis/quick-answer-tool";
import { readabilityTool } from "../../tools/analysis/readability-tool";
import { seoScoreTool } from "../../tools/analysis/seo-score-tool";
import { titleMetaTool } from "../../tools/analysis/title-meta-tool";
import { toneAnalysisTool } from "../../tools/analysis/tone-analysis-tool";
import { editTitleTool } from "../../tools/frontmatter/edit-title-tool";
import { editDescriptionTool } from "../../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../../tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "../../tools/frontmatter/edit-slug-tool";
import { optimizeTitleTool } from "../../tools/editor/optimize-title-tool";
import { optimizeMetaTool } from "../../tools/editor/optimize-meta-tool";
import { injectKeywordsTool } from "../../tools/editor/inject-keywords-tool";
import { addInternalLinksTool } from "../../tools/editor/add-internal-links-tool";
import { addExternalLinksTool } from "../../tools/editor/add-external-links-tool";
import { improveReadabilityTool } from "../../tools/editor/improve-readability-tool";
import { generateQuickAnswerTool } from "../../tools/editor/generate-quick-answer-tool";
import { suggestImagesTool } from "../../tools/editor/suggest-images-tool";
import { dateTool } from "../../tools/date-tool";

const memory = new Memory({
   options: {
      lastMessages: 20,
      generateTitle: {
         model: "openrouter/google/gemini-2.5-flash-lite",
      },
   },
});

const getInstructions = (
   language: string,
   writerInstructions?: InstructionMemoryItem[],
): string => {
   const compiledMemories = compileInstructionMemories(writerInstructions ?? []);
   const languageInstruction = buildLanguageInstruction(language);

   return `
${languageInstruction}

${compiledMemories}

# SEO AUDITOR AGENT

You are an expert SEO analyst and optimizer.
Your job: audit content SEO quality and apply concrete improvements.

## SEO AUDIT PRIORITY ORDER

1. seoScore — overall score baseline
2. titleMeta → optimizeTitle, optimizeMeta — title/description
3. contentStructure — heading hierarchy
4. keywordDensity → injectKeywords — keyword usage
5. readability → improveReadability — clarity
6. quickAnswerAnalysis → generateQuickAnswer — featured snippet opportunity
7. linkDensity → addInternalLinks, addExternalLinks — link profile
8. imageSeo → suggestImages — image optimization
9. badPatterns — AI-sounding content, fillers
10. duplicateContent — uniqueness check

## ALWAYS FOLLOW THIS PATTERN

1. Run seoScore first for overall picture
2. Run issue-specific tools based on low scores
3. Apply fixes using editor/frontmatter tools
4. Re-run seoScore to confirm improvements
5. Deliver a prioritized report (High/Medium/Low)

## REPORT FORMAT

\`\`\`
# SEO Audit Report

## Overall Score: X/100

## High Priority Issues
- [Issue]: [Fix applied or recommendation]

## Medium Priority Issues
- [Issue]: [Fix applied or recommendation]

## Low Priority Issues
- [Issue]: [Fix applied or recommendation]

## Summary of Changes Applied
- [Change 1]
- [Change 2]
\`\`\`

Respond in the same language as the user request.
`;
};

export const seoAuditorAgent: Agent = new Agent({
   id: "seo-auditor-agent",
   name: "SEO Auditor Agent",
   description:
      "Specialized in SEO analysis, scoring, keyword density, readability, title/meta optimization, link density, image SEO, duplicate content detection, and applying SEO improvements. Use this agent for: SEO audits, SEO scores, keyword optimization, meta description optimization, readability improvements.",

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
      editTitle: editTitleTool,
      editDescription: editDescriptionTool,
      editKeywords: editKeywordsTool,
      editSlug: editSlugTool,
      optimizeTitle: optimizeTitleTool,
      optimizeMeta: optimizeMetaTool,
      injectKeywords: injectKeywordsTool,
      addInternalLinks: addInternalLinksTool,
      addExternalLinks: addExternalLinksTool,
      improveReadability: improveReadabilityTool,
      generateQuickAnswer: generateQuickAnswerTool,
      suggestImages: suggestImagesTool,
      dateTool: dateTool,
   },
});
```

**Step 2: Verify TypeScript**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep -E "error|Error" | head -20
```

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/agents/specialized/seo-auditor-agent.ts
git commit -m "feat(agents): add specialized SEO auditor agent"
```

---

## Task 4: Create the Reviewer Agent

The reviewer agent handles the REVIEW workflow — quality checks, tone, citations, originality.

**Files:**
- Create: `packages/agents/src/mastra/agents/specialized/reviewer-agent.ts`

**Step 1: Create the file**

```typescript
// packages/agents/src/mastra/agents/specialized/reviewer-agent.ts
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../../utils";
import { badPatternTool } from "../../tools/analysis/bad-pattern-tool";
import { citationTool } from "../../tools/analysis/citation-tool";
import { contentStructureTool } from "../../tools/analysis/content-structure-tool";
import { duplicateContentTool } from "../../tools/analysis/duplicate-content-tool";
import { originalityTool } from "../../tools/analysis/originality-tool";
import { readabilityTool } from "../../tools/analysis/readability-tool";
import { toneAnalysisTool } from "../../tools/analysis/tone-analysis-tool";
import { addEditorCommentTool } from "../../tools/editor/add-editor-comment-tool";
import { proposeSuggestionTool } from "../../tools/editor/propose-suggestion-tool";
import { replaceTextTool } from "../../tools/editor/replace-text-tool";
import { dateTool } from "../../tools/date-tool";

const memory = new Memory({
   options: {
      lastMessages: 20,
      generateTitle: {
         model: "openrouter/google/gemini-2.5-flash-lite",
      },
   },
});

const getInstructions = (
   language: string,
   writerInstructions?: InstructionMemoryItem[],
): string => {
   const compiledMemories = compileInstructionMemories(writerInstructions ?? []);
   const languageInstruction = buildLanguageInstruction(language);

   return `
${languageInstruction}

${compiledMemories}

# REVIEWER AGENT

You are an expert content editor and quality reviewer.
Your job: assess content quality and deliver actionable feedback with specific edits.

## REVIEW FRAMEWORK

Run these checks in order:

1. **Structure** — contentStructure: heading hierarchy, section balance
2. **Quality** — citation: claims backed by sources; originality: uniqueness
3. **Tone** — toneAnalysis: consistent voice and style
4. **Readability** — readability: Flesch score and complexity
5. **Patterns** — badPatterns: AI-sounding phrases, clichés, fillers

## APPLY CHANGES DIRECTLY

Don't just report issues — fix them:
- proposeSuggestion — propose a tracked change with rationale
- addEditorComment — add a comment for the author
- replaceText — apply a direct fix inline

## FEEDBACK FORMAT

\`\`\`
# Content Review Report

## Executive Summary
[2-3 sentences overall assessment]

## High Priority
- [Issue]: [Specific fix or suggested edit]

## Medium Priority
- [Issue]: [Specific fix or suggested edit]

## Low Priority
- [Issue]: [Specific fix or suggested edit]

## What Works Well
- [Strength 1]
- [Strength 2]

## Action Plan
1. [Highest-impact fix]
2. [Next fix]
3. [Next fix]
\`\`\`

Respond in the same language as the user request.
`;
};

export const reviewerAgent: Agent = new Agent({
   id: "reviewer-agent",
   name: "Content Reviewer Agent",
   description:
      "Specialized in content quality review, tone analysis, readability assessment, citation validation, originality checking, and structural feedback. Use this agent for: reviewing content quality, checking tone consistency, validating citations, detecting AI-sounding patterns, content feedback.",

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
      contentStructure: contentStructureTool,
      citation: citationTool,
      originality: originalityTool,
      toneAnalysis: toneAnalysisTool,
      readability: readabilityTool,
      badPatterns: badPatternTool,
      duplicateContent: duplicateContentTool,
      addEditorComment: addEditorCommentTool,
      proposeSuggestion: proposeSuggestionTool,
      replaceText: replaceTextTool,
      dateTool: dateTool,
   },
});
```

**Step 2: Verify TypeScript**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep -E "error|Error" | head -20
```

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/agents/specialized/reviewer-agent.ts
git commit -m "feat(agents): add specialized content reviewer agent"
```

---

## Task 5: Create the Content Network Agent (Router)

This is the router agent. It uses Mastra's native `agents` config and `.network()` call pattern. It knows about its sub-agents through their descriptions and delegates accordingly.

**Files:**
- Create: `packages/agents/src/mastra/agents/content-network-agent.ts`

**Step 1: Create the file**

```typescript
// packages/agents/src/mastra/agents/content-network-agent.ts
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";
import { researchAgent } from "./specialized/research-agent";
import { writerAgent } from "./specialized/writer-agent";
import { seoAuditorAgent } from "./specialized/seo-auditor-agent";
import { reviewerAgent } from "./specialized/reviewer-agent";

const memory = new Memory({
   options: {
      lastMessages: 30,
      generateTitle: {
         model: "openrouter/google/gemini-2.5-flash-lite",
      },
   },
});

const getRouterInstructions = (
   language: string,
   writerInstructions?: InstructionMemoryItem[],
): string => {
   const compiledMemories = compileInstructionMemories(writerInstructions ?? []);
   const languageInstruction = buildLanguageInstruction(language);

   return `
${languageInstruction}

${compiledMemories}

# CONTENT NETWORK ROUTER

You are the orchestration layer for a network of specialized content agents.
Your job: understand what the user wants and route to the right specialist.

## YOUR SPECIALISTS

**research-agent** — Research & Planning Agent
Use when: researching topics, planning content, analyzing SERPs, finding competitors, keyword research, content gaps, building outlines

**writer-agent** — Writer & Editor Agent
Use when: writing articles, editing content, inserting elements, formatting, making inline edits, producing full content drafts

**seo-auditor-agent** — SEO Auditor Agent
Use when: SEO analysis, SEO scores, keyword density, title/meta optimization, readability, link density, image SEO

**reviewer-agent** — Content Reviewer Agent
Use when: reviewing content quality, tone analysis, citation validation, originality checking, structural feedback

## ROUTING RULES

1. **Writing request** → writer-agent (research first if needed, then write)
2. **Research request** → research-agent
3. **Planning request** → research-agent (it handles planning + frontmatter)
4. **SEO audit** → seo-auditor-agent
5. **Review / feedback** → reviewer-agent
6. **Complex request** → chain specialists: e.g., research-agent then writer-agent

## IMPORTANT

- You DO NOT have tools yourself — your specialists do
- For questions that don't need tools (definitions, explanations), answer directly
- Always include the specialist's full output in your final response
- Route once; don't bounce between agents unnecessarily

## EXAMPLES

"Write an article about TypeScript generics"
→ writer-agent (it will research before writing)

"Research React Server Components"
→ research-agent

"Plan a content series about microservices"
→ research-agent

"Audit the SEO of this content"
→ seo-auditor-agent

"Review this article for quality"
→ reviewer-agent

"Research and write a complete article about Next.js 15"
→ research-agent → writer-agent (sequential)

Respond in the same language as the user request.
`;
};

/**
 * Content Network Agent (Router)
 *
 * Orchestrates a network of specialized content agents:
 * - Research & Planning Agent
 * - Writer & Editor Agent
 * - SEO Auditor Agent
 * - Content Reviewer Agent
 *
 * Registered under the "unifiedContent" key in Mastra, so the public API
 * (mastra.getAgent("unifiedContent")) remains unchanged.
 *
 * Uses Mastra's native agent network pattern: the `agents` config makes
 * sub-agents available to the router, which delegates via the network loop.
 */
export const contentNetworkAgent: Agent = new Agent({
   id: "content-network-agent",
   name: "Content Network Agent",
   description:
      "Orchestration agent that routes content tasks to specialized agents for research, writing, SEO auditing, and review.",

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
      return getRouterInstructions(language, writerInstructions);
   },

   memory,

   // Sub-agents available for network delegation
   agents: {
      "research-agent": researchAgent,
      "writer-agent": writerAgent,
      "seo-auditor-agent": seoAuditorAgent,
      "reviewer-agent": reviewerAgent,
   },

   // Router has no direct tools — specialists handle tool usage
   tools: {},
});
```

**Step 2: Verify TypeScript**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep -E "error|Error" | head -20
```

Expected: No errors.

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/agents/content-network-agent.ts
git commit -m "feat(agents): add content network router agent"
```

---

## Task 6: Wire the Network Agent into Mastra and Update Index

Replace `unifiedContentAgent` with `contentNetworkAgent` under the `"unifiedContent"` key in Mastra. Keep the original unified agent registered under a separate key for fallback purposes.

**Files:**
- Modify: `packages/agents/src/mastra/index.ts`

**Step 1: Read the current index.ts**

Check the current file at `packages/agents/src/mastra/index.ts` (already read above — lines 1-106).

**Step 2: Apply the edit**

Change the `agents` object in `new Mastra(...)` from:

```typescript
   agents: {
      // Unified content agent (combines all workflows)
      unifiedContent: unifiedContentAgent,

      // Specialized agents (kept separate)
      fimAgent,
      inlineEditAgent,
   },
```

To:

```typescript
   agents: {
      // Content network agent (router → specialized agents)
      // Registered under "unifiedContent" to preserve the public API surface
      unifiedContent: contentNetworkAgent,

      // Specialized agents (registered for direct access if needed)
      researchAgent,
      writerAgent,
      seoAuditorAgent,
      reviewerAgent,

      // Kept separate — different contexts
      fimAgent,
      inlineEditAgent,
   },
```

And update the imports at the top of `index.ts`:

Remove:
```typescript
import { unifiedContentAgent } from "./agents/unified-content-agent";
```

Add:
```typescript
import { contentNetworkAgent } from "./agents/content-network-agent";
import { researchAgent } from "./agents/specialized/research-agent";
import { writerAgent } from "./agents/specialized/writer-agent";
import { seoAuditorAgent } from "./agents/specialized/seo-auditor-agent";
import { reviewerAgent } from "./agents/specialized/reviewer-agent";
```

The final `index.ts` should look like this (full file):

```typescript
import path from "node:path";
import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { LocalFilesystem, Workspace } from "@mastra/core/workspace";
import { Observability } from "@mastra/observability";
import { PostgresStore } from "@mastra/pg";
import { PosthogExporter } from "@mastra/posthog";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { env as serverEnv } from "@packages/environment/server";
import type { ModelId } from "../models";
import { pgVectorStore } from "../utils";
import { contentNetworkAgent } from "./agents/content-network-agent";
import { researchAgent } from "./agents/specialized/research-agent";
import { writerAgent } from "./agents/specialized/writer-agent";
import { seoAuditorAgent } from "./agents/specialized/seo-auditor-agent";
import { reviewerAgent } from "./agents/specialized/reviewer-agent";
import { fimAgent } from "./agents/fim-agent";
import { inlineEditAgent } from "./agents/inline-edit-agent";
export type { RequestContext };

export type CustomRequestContext = {
   userId: string;
   writerId?: string;
   model?: ModelId;
   language?: string;
   writerInstructions?: InstructionMemoryItem[];
   // Generation parameter overrides (from model preset or user setting)
   temperature?: number;
   topP?: number;
   maxTokens?: number;
   frequencyPenalty?: number;
   presencePenalty?: number;
};

const mastraStorage = new PostgresStore({
   id: "mastra-storage",
   connectionString: serverEnv.PG_VECTOR_URL,
});

const workspace = new Workspace({
   filesystem: new LocalFilesystem({
      basePath: path.resolve(import.meta.dirname, "./workspace"),
   }),
   skills: ["/skills"],
   bm25: true,
});
const observability = new Observability({
   configs: {
      posthog: {
         serviceName: "contentta-agents",
         exporters: [
            new PosthogExporter({
               apiKey: serverEnv.POSTHOG_KEY,
               host: serverEnv.POSTHOG_HOST,
               defaultDistinctId: "system",
            }),
         ],
      },
   },
});

export const mastra: Mastra = new Mastra({
   agents: {
      // Content network agent (router → specialized agents)
      // Registered under "unifiedContent" to preserve the public API surface
      unifiedContent: contentNetworkAgent,

      // Specialized agents (registered for direct access if needed)
      researchAgent,
      writerAgent,
      seoAuditorAgent,
      reviewerAgent,

      // Kept separate — different contexts
      fimAgent,
      inlineEditAgent,
   },
   vectors: { pgVector: pgVectorStore },
   storage: mastraStorage,
   workspace,
   observability,
});

export function createRequestContext(context: CustomRequestContext) {
   const requestContext = new RequestContext<CustomRequestContext>();
   requestContext.set("userId", context.userId);

   if (context.writerId) {
      requestContext.set("writerId", context.writerId);
   }
   if (context.model) {
      requestContext.set("model", context.model);
   }
   if (context.temperature !== undefined) {
      requestContext.set("temperature", context.temperature);
   }
   if (context.topP !== undefined) {
      requestContext.set("topP", context.topP);
   }
   if (context.maxTokens !== undefined) {
      requestContext.set("maxTokens", context.maxTokens);
   }
   if (context.frequencyPenalty !== undefined) {
      requestContext.set("frequencyPenalty", context.frequencyPenalty);
   }
   if (context.presencePenalty !== undefined) {
      requestContext.set("presencePenalty", context.presencePenalty);
   }
   if (context.language) {
      requestContext.set("language", context.language);
   }
   if (context.writerInstructions) {
      requestContext.set("writerInstructions", context.writerInstructions);
   }
   return requestContext;
}
export * from "@mastra/ai-sdk";
```

**Step 3: Verify TypeScript**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep -E "error|Error" | head -30
```

Expected: No errors.

**Step 4: Commit**

```bash
git add packages/agents/src/mastra/index.ts
git commit -m "feat(agents): wire content network agent as unifiedContent in Mastra"
```

---

## Task 7: Update MIGRATION.md and Verify Public API Unchanged

The oRPC routers (`agent.ts`, `clusters.ts`, `chat.ts`) all call `mastra.getAgent("unifiedContent")` — this key is preserved so zero changes are needed in those files. Verify this and update the migration doc.

**Files:**
- Modify: `packages/agents/MIGRATION.md`

**Step 1: Verify no oRPC router changes needed**

```bash
grep -r "unifiedContent\|unifiedContentAgent" \
  /home/yorizel/Documents/contentta-nx/apps/web/src \
  --include="*.ts" --include="*.tsx" -n
```

Expected: All calls use `mastra.getAgent("unifiedContent")` — that key still exists, pointing to the new `contentNetworkAgent`. No changes needed in oRPC routers.

**Step 2: Verify the original unified-content-agent.ts is still importable**

```bash
ls /home/yorizel/Documents/contentta-nx/packages/agents/src/mastra/agents/unified-content-agent.ts
```

Expected: File exists. It is intentionally left in place — it is not imported by anything after this migration, but it is kept as documentation and a fallback reference.

**Step 3: Update MIGRATION.md**

Replace the entire content of `packages/agents/MIGRATION.md` with:

```markdown
# Agent Architecture Migration Guide

## Overview

Contentta uses a two-phase agent architecture strategy.

---

## Phase 1: Monolith → Unified Agent (Completed)

**Before (deprecated):**
- 1 orchestrator agent
- 5 sub-agents (planner, researcher, writer, seoAuditor, reviewer)
- ~30% overhead from delegation and coordination

**After (current in packages/):**
- 1 unified content agent with all workflows
- Direct access to 40+ tools
- 30% faster, simpler to maintain

---

## Phase 2: Unified Agent → Specialized Network (Current)

**Architecture:**
- 1 router agent (`contentNetworkAgent`) registered as `"unifiedContent"`
- 4 specialized sub-agents via Mastra's native `agents` config + `.network()` API
- Public API unchanged: `mastra.getAgent("unifiedContent")` still works

**Agents:**

| Agent | Key | Workflows |
|-------|-----|-----------|
| Content Network Agent (router) | `unifiedContent` | Routes to specialists |
| Research & Planning Agent | `researchAgent` | Research, Planning |
| Writer & Editor Agent | `writerAgent` | Writing, Editing |
| SEO Auditor Agent | `seoAuditorAgent` | SEO Audit |
| Content Reviewer Agent | `reviewerAgent` | Review |

**How Mastra network works:**
```typescript
// Router agent config:
const contentNetworkAgent = new Agent({
  agents: { "research-agent": researchAgent, ... },
  // No tools — delegates to sub-agents
});

// Called via standard .stream() / .generate() — no API change needed
const agent = mastra.getAgent("unifiedContent");
const result = await agent.stream([...], { requestContext });
```

**Files:**
```
packages/agents/src/mastra/
├── agents/
│   ├── content-network-agent.ts        ← Router (registered as "unifiedContent")
│   ├── specialized/
│   │   ├── research-agent.ts           ← Research + Planning
│   │   ├── writer-agent.ts             ← Writing + Editing
│   │   ├── seo-auditor-agent.ts        ← SEO Audit
│   │   └── reviewer-agent.ts           ← Review
│   ├── unified-content-agent.ts        ← Kept as reference (not imported)
│   ├── fim-agent.ts                    ← Unchanged
│   └── inline-edit-agent.ts            ← Unchanged
└── index.ts                            ← Mastra instance
```

## Benefits

| Aspect | Unified Agent | Network |
|--------|--------------|---------|
| **Context window** | 40+ tools always loaded | 10-15 tools per specialist |
| **Focus** | Generic | Domain-specific |
| **Maintenance** | 1 large file | 4 focused files |
| **Debugging** | Linear flow | Clear agent boundaries |
| **Extensibility** | Harder (one agent) | Add new specialist easily |

## Specialized Agents (Always Separate)

- **FIM Agent** (`fimAgent`) — Autocomplete and fill-in-the-middle
- **Inline Edit Agent** (`inlineEditAgent`) — Real-time inline editing
```

**Step 4: Commit**

```bash
git add packages/agents/MIGRATION.md
git commit -m "docs(agents): update migration guide for agent network architecture"
```

---

## Task 8: Run Full Typecheck and Lint

Verify the entire monorepo compiles cleanly after all changes.

**Step 1: Run typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | tail -20
```

Expected: Exit 0, no errors referencing files in `packages/agents/`.

**Step 2: Run Biome lint**

```bash
cd /home/yorizel/Documents/contentta-nx/packages/agents
bun run check
```

Expected: No lint errors. If there are import order issues, Biome will auto-fix them.

**Step 3: Verify agent key is unchanged in all callers**

```bash
grep -r "getAgent\|unifiedContent" \
  /home/yorizel/Documents/contentta-nx/apps/web/src \
  --include="*.ts" --include="*.tsx" -n
```

Expected: All calls use `getAgent("unifiedContent")` — unchanged.

**Step 4: Commit (if lint made fixes)**

```bash
git add -p  # stage only lint-fixed files if any
git commit -m "chore(agents): fix lint issues after network agent migration"
```

Only commit if there are actual changes. Skip if lint was clean.

---

## Task 9: Final Verification Checklist

Run through this list manually to confirm the migration is complete and correct.

**Checklist:**

1. `packages/agents/src/mastra/agents/specialized/research-agent.ts` — exists, has correct tools
2. `packages/agents/src/mastra/agents/specialized/writer-agent.ts` — exists, has correct tools
3. `packages/agents/src/mastra/agents/specialized/seo-auditor-agent.ts` — exists, has correct tools
4. `packages/agents/src/mastra/agents/specialized/reviewer-agent.ts` — exists, has correct tools
5. `packages/agents/src/mastra/agents/content-network-agent.ts` — exists, has `agents:` config with all 4 specialists
6. `packages/agents/src/mastra/index.ts` — `unifiedContent` key points to `contentNetworkAgent`
7. `packages/agents/src/mastra/agents/unified-content-agent.ts` — file still exists (not deleted)
8. `apps/web/src/integrations/orpc/router/agent.ts` — unchanged (still calls `getAgent("unifiedContent")`)
9. `apps/web/src/integrations/orpc/router/chat.ts` — unchanged
10. `apps/web/src/integrations/orpc/router/clusters.ts` — unchanged
11. `apps/web/src/routes/api/chat/$.ts` — unchanged

**Step 1: Verify file existence**

```bash
ls /home/yorizel/Documents/contentta-nx/packages/agents/src/mastra/agents/specialized/
```

Expected output:
```
research-agent.ts
writer-agent.ts
seo-auditor-agent.ts
reviewer-agent.ts
```

**Step 2: Verify router still works**

```bash
grep "unifiedContent" /home/yorizel/Documents/contentta-nx/packages/agents/src/mastra/index.ts
```

Expected: `unifiedContent: contentNetworkAgent,`

**Step 3: Run final typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx
bun run typecheck 2>&1 | grep -c "error" || echo "0 errors"
```

Expected: `0 errors`

**Step 4: Final commit if needed**

```bash
git status
# If clean, no commit needed
# If any remaining changes: git add <files> && git commit -m "chore(agents): final cleanup"
```

---

## Summary

After completing all tasks, the agent architecture will be:

```
User Request → mastra.getAgent("unifiedContent") (unchanged)
                       ↓
           contentNetworkAgent (router)
           ├── research-agent     (research + planning, ~16 tools)
           ├── writer-agent       (writing + editing, ~26 tools)
           ├── seo-auditor-agent  (SEO analysis, ~26 tools)
           └── reviewer-agent     (quality review, ~11 tools)
```

The monolithic `unified-content-agent.ts` (40+ tools, one agent for everything) is replaced by a network where each specialist carries only the tools it needs.

**Zero breaking changes to:**
- `createRequestContext()` API
- `mastra.getAgent("unifiedContent")` call
- All oRPC router procedures
- All frontend hooks (`useUnifiedAgent`, etc.)
- All streaming patterns in `agent.ts`, `clusters.ts`, `chat.ts`
