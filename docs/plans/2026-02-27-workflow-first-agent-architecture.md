# Workflow-first Agent Architecture + Beautiful Tool UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace freeform LLM agent routing with deterministic, skill-centric workflows; expose them via typed oRPC procedures; and render all agent activity — tool calls, step progress, and workflow results — with beautiful, domain-aware UIs inspired by Perplexity (step timelines) and Claude AI (expandable result cards).

**Architecture:**
1. **Backend** — Central Tool Registry + 6 new Mastra workflows (seo-audit, geo-optimize, research, content-review, competitor-analysis, keyword-strategy). Platform router updated with workflow awareness. `CustomRequestContext` extended with route/team/brand fields. New `executeWorkflow` + `executeWorkflowStream` oRPC procedures.
2. **Tool UI** — Named `ToolCallMessagePartComponent` registrations per tool group in `MessagePrimitive.Parts` (based on existing `agentic-ui-tool-components.md`). Full display config with icons and labels. Friendly labels in `ToolFallback`.
3. **Workflow UI** — Perplexity-style `WorkflowStepTimeline` shows live step progress. Claude-style `WorkflowResultCard` renders typed outputs (score deltas, change lists, keyword clusters). Premium `WorkflowTriggerPanel` in editor toolbar with icon pills, gradient hover states, and loading rings.

**Tech Stack:** Mastra (`createWorkflow`, `createStep`), TypeScript, oRPC, TanStack Query, `@assistant-ui/react`, lucide-react, Tailwind CSS, Framer Motion (for step animations if already in the project)

**Prerequisite:** The `agentic-ui-tool-components.md` plan covers Tasks A1–A6 (tool display config, AgentCallTool, EditorTool, ResearchTool, ToolFallback labels, thread.tsx registration). Those tasks must be completed first or run in parallel with Phase 1 backend tasks, since they share no file dependencies.

---

## Phase 1 — Tool Registry + Workflow Utilities

### Task 1: Create Tool Registry

**Files:**
- Create: `packages/agents/src/mastra/tool-registry.ts`

**Step 1: Create the file**

```typescript
// packages/agents/src/mastra/tool-registry.ts
import { badPatternTool } from "./tools/analysis/bad-pattern-tool";
import { citationTool } from "./tools/analysis/citation-tool";
import { contentStructureTool } from "./tools/analysis/content-structure-tool";
import { duplicateContentTool } from "./tools/analysis/duplicate-content-tool";
import { imageSeoTool } from "./tools/analysis/image-seo-tool";
import { keywordDensityTool } from "./tools/analysis/keyword-density-tool";
import { linkDensityTool } from "./tools/analysis/link-density-tool";
import { originalityTool } from "./tools/analysis/originality-tool";
import { quickAnswerAnalysisTool } from "./tools/analysis/quick-answer-tool";
import { readabilityTool } from "./tools/analysis/readability-tool";
import { seoScoreTool } from "./tools/analysis/seo-score-tool";
import { titleMetaTool } from "./tools/analysis/title-meta-tool";
import { toneAnalysisTool } from "./tools/analysis/tone-analysis-tool";
import { dateTool } from "./tools/date-tool";
import { addEditorCommentTool } from "./tools/editor/add-editor-comment-tool";
import { addExternalLinksTool } from "./tools/editor/add-external-links-tool";
import { addInternalLinksTool } from "./tools/editor/add-internal-links-tool";
import { deleteTextTool } from "./tools/editor/delete-text-tool";
import { formatTextTool } from "./tools/editor/format-text-tool";
import { generateQuickAnswerTool } from "./tools/editor/generate-quick-answer-tool";
import { improveReadabilityTool } from "./tools/editor/improve-readability-tool";
import { injectKeywordsTool } from "./tools/editor/inject-keywords-tool";
import { insertCodeBlockTool } from "./tools/editor/insert-code-block-tool";
import { insertHeadingTool } from "./tools/editor/insert-heading-tool";
import { insertListTool } from "./tools/editor/insert-list-tool";
import { insertTableTool } from "./tools/editor/insert-table-tool";
import { insertTextTool } from "./tools/editor/insert-text-tool";
import { optimizeMetaTool } from "./tools/editor/optimize-meta-tool";
import { optimizeTitleTool } from "./tools/editor/optimize-title-tool";
import { proposeSuggestionTool } from "./tools/editor/propose-suggestion-tool";
import { replaceTextTool } from "./tools/editor/replace-text-tool";
import { editDescriptionTool } from "./tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "./tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "./tools/frontmatter/edit-slug-tool";
import { editTitleTool } from "./tools/frontmatter/edit-title-tool";
import { getInstructionsTool } from "./tools/memory/get-instructions-tool";
import { graphSearchTool } from "./tools/rag/graph-search-tool";
import { searchPreviousContentTool } from "./tools/rag/search-previous-content-tool";
import { competitorContentTool } from "./tools/research/competitor-content-tool";
import { contentGapTool } from "./tools/research/content-gap-tool";
import { factFinderTool } from "./tools/research/fact-finder-tool";
import { relatedKeywordsTool } from "./tools/research/related-keywords-tool";
import { researchCompletenessTool } from "./tools/research/research-completeness-tool";
import { serpAnalysisTool } from "./tools/research/serp-analysis-tool";
import { webCrawlTool } from "./tools/research/web-crawl-tool";
import { webSearchTool } from "./tools/research/web-search-tool";

export const TOOL_GROUPS = {
   "seo:analyze": {
      seoScore: seoScoreTool,
      titleMeta: titleMetaTool,
      contentStructure: contentStructureTool,
      keywordDensity: keywordDensityTool,
      readability: readabilityTool,
      quickAnswerAnalysis: quickAnswerAnalysisTool,
      linkDensity: linkDensityTool,
      imageSeo: imageSeoTool,
      badPatterns: badPatternTool,
      duplicateContent: duplicateContentTool,
      toneAnalysis: toneAnalysisTool,
   },
   "seo:write": {
      optimizeTitle: optimizeTitleTool,
      optimizeMeta: optimizeMetaTool,
      injectKeywords: injectKeywordsTool,
      addInternalLinks: addInternalLinksTool,
      addExternalLinks: addExternalLinksTool,
      improveReadability: improveReadabilityTool,
      generateQuickAnswer: generateQuickAnswerTool,
   },
   "geo:analyze": {
      citation: citationTool,
      contentStructure: contentStructureTool,
      quickAnswerAnalysis: quickAnswerAnalysisTool,
      originality: originalityTool,
      toneAnalysis: toneAnalysisTool,
      badPatterns: badPatternTool,
      readability: readabilityTool,
   },
   "geo:write": {
      generateQuickAnswer: generateQuickAnswerTool,
      insertTable: insertTableTool,
      insertList: insertListTool,
      addExternalLinks: addExternalLinksTool,
      replaceText: replaceTextTool,
      insertText: insertTextTool,
      addEditorComment: addEditorCommentTool,
      proposeSuggestion: proposeSuggestionTool,
   },
   research: {
      webSearch: webSearchTool,
      serpAnalysis: serpAnalysisTool,
      competitorContent: competitorContentTool,
      contentGap: contentGapTool,
      relatedKeywords: relatedKeywordsTool,
      factFinder: factFinderTool,
      webCrawl: webCrawlTool,
      researchCompleteness: researchCompletenessTool,
   },
   "write:full": {
      insertText: insertTextTool,
      replaceText: replaceTextTool,
      deleteText: deleteTextTool,
      formatText: formatTextTool,
      insertHeading: insertHeadingTool,
      insertList: insertListTool,
      insertCodeBlock: insertCodeBlockTool,
      insertTable: insertTableTool,
      proposeSuggestion: proposeSuggestionTool,
      addEditorComment: addEditorCommentTool,
   },
   review: {
      contentStructure: contentStructureTool,
      toneAnalysis: toneAnalysisTool,
      badPatterns: badPatternTool,
      citation: citationTool,
      duplicateContent: duplicateContentTool,
      readability: readabilityTool,
      originality: originalityTool,
      addEditorComment: addEditorCommentTool,
      proposeSuggestion: proposeSuggestionTool,
      replaceText: replaceTextTool,
   },
   frontmatter: {
      editTitle: editTitleTool,
      editDescription: editDescriptionTool,
      editKeywords: editKeywordsTool,
      editSlug: editSlugTool,
   },
   memory: { getInstructionMemories: getInstructionsTool },
   rag: {
      searchPreviousContent: searchPreviousContentTool,
      graphSearch: graphSearchTool,
   },
   utility: { dateTool: dateTool },
} as const;

export type ToolGroupKey = keyof typeof TOOL_GROUPS;

export function assembleTools(...groups: ToolGroupKey[]): Record<string, unknown> {
   return Object.assign({}, ...groups.map((g) => TOOL_GROUPS[g]));
}
```

**Step 2: Typecheck**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/tool-registry.ts
git commit -m "feat(agents): add tool registry — capability-tagged tool groups"
```

---

### Task 2: Create Workflow Utilities

**Files:**
- Create: `packages/agents/src/mastra/workflows/utils.ts`
- Modify: `packages/agents/src/mastra/workflows/content-creation-workflow.ts` (remove local duplicate)

**Step 1: Create utils.ts**

```typescript
// packages/agents/src/mastra/workflows/utils.ts

export function parseReviewSignal(text: string): {
   approved: boolean;
   issues: string[];
} {
   const match = text.match(/REVIEW_SIGNAL:\s*(\{.*?\})/s);
   if (!match) return { approved: false, issues: ["Could not parse review signal"] };
   try {
      // biome-ignore lint/style/noNonNullAssertion: match[1] is guaranteed
      return JSON.parse(match[1]!) as { approved: boolean; issues: string[] };
   } catch {
      return { approved: false, issues: ["Invalid review signal JSON"] };
   }
}

export function parseSeoScore(text: string): number {
   const match = text.match(/Overall Score:\s*(\d+)/i);
   if (!match?.[1]) return 0;
   return Math.min(100, Math.max(0, Number.parseInt(match[1], 10)));
}

export function parseAuditIssues(
   text: string,
): Array<{ priority: "High" | "Medium" | "Low"; description: string }> {
   const issues: Array<{ priority: "High" | "Medium" | "Low"; description: string }> = [];
   const extract = (section: string, priority: "High" | "Medium" | "Low") => {
      const match = text.match(new RegExp(`## ${section} Priority Issues([\\s\\S]*?)(?=## |$)`, "i"));
      for (const line of (match?.[1] ?? "").split("\n").filter((l) => l.trim().startsWith("-"))) {
         issues.push({ priority, description: line.replace(/^-\s*/, "").trim() });
      }
   };
   extract("High", "High");
   extract("Medium", "Medium");
   extract("Low", "Low");
   return issues;
}
```

**Step 2: Remove local `parseReviewSignal` from `content-creation-workflow.ts` and add import**

In `packages/agents/src/mastra/workflows/content-creation-workflow.ts`:
- Delete lines 11–22 (the local `parseReviewSignal` function)
- Add at top of imports: `import { parseReviewSignal } from "./utils";`

**Step 3: Typecheck + commit**

```bash
bun run typecheck 2>&1 | head -10
git add packages/agents/src/mastra/workflows/utils.ts packages/agents/src/mastra/workflows/content-creation-workflow.ts
git commit -m "refactor(agents): extract workflow utilities — parseReviewSignal, parseSeoScore, parseAuditIssues"
```

---

## Phase 2 — New Workflows

### Task 3: SEO Audit Workflow

**Files:**
- Create: `packages/agents/src/mastra/workflows/seo-audit-workflow.ts`

**Step 1: Create the workflow**

```typescript
// packages/agents/src/mastra/workflows/seo-audit-workflow.ts
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { seoAuditorAgent } from "../agents/seo-auditor-agent";
import { parseAuditIssues, parseSeoScore } from "./utils";

const issueSchema = z.object({
   priority: z.enum(["High", "Medium", "Low"]),
   description: z.string(),
});

const seoAnalyzeStep = createStep({
   id: "seo-analyze",
   inputSchema: z.object({}),
   outputSchema: z.object({
      score: z.number(),
      report: z.string(),
      issues: z.array(issueSchema),
   }),
   execute: async ({ requestContext }) => {
      const result = await seoAuditorAgent.generate(
         "Run a full SEO audit following the otimizacao-seo skill checklist. Use seoScore first, then all relevant analysis tools. Output a structured report: Overall Score: X/100, ## High Priority Issues, ## Medium Priority Issues, ## Low Priority Issues, ## Summary of Changes Applied. Do NOT apply fixes in this step.",
         { requestContext },
      );
      return {
         score: parseSeoScore(result.text),
         report: result.text,
         issues: parseAuditIssues(result.text),
      };
   },
});

const seoApplyFixesStep = createStep({
   id: "seo-apply-fixes",
   inputSchema: z.object({
      score: z.number(),
      report: z.string(),
      issues: z.array(issueSchema),
   }),
   outputSchema: z.object({
      scoreBefore: z.number(),
      scoreAfter: z.number(),
      issues: z.array(issueSchema),
      changesApplied: z.array(z.string()),
      report: z.string(),
   }),
   execute: async ({ inputData, requestContext }) => {
      const highAndMedium = inputData.issues
         .filter((i) => i.priority === "High" || i.priority === "Medium")
         .map((i) => `- [${i.priority}] ${i.description}`)
         .join("\n");

      const fixResult = await seoAuditorAgent.generate(
         `Apply fixes for these SEO issues using your tools:\n${highAndMedium}\nAfter fixes, run seoScore again and report Overall Score: X/100. List each change under ## Summary of Changes Applied.`,
         { requestContext },
      );

      const changesSection =
         fixResult.text.match(/## Summary of Changes Applied([\s\S]*?)(?=## |$)/i)?.[1] ?? "";
      const changesApplied = changesSection
         .split("\n")
         .filter((l) => l.trim().startsWith("-"))
         .map((l) => l.replace(/^-\s*/, "").trim());

      return {
         scoreBefore: inputData.score,
         scoreAfter: parseSeoScore(fixResult.text),
         issues: inputData.issues,
         changesApplied,
         report: `${inputData.report}\n\n---\n\n## Fixes Applied\n${fixResult.text}`,
      };
   },
});

export const seoAuditWorkflow = createWorkflow({
   id: "seo-audit",
   inputSchema: z.object({}),
   outputSchema: z.object({
      scoreBefore: z.number(),
      scoreAfter: z.number(),
      issues: z.array(issueSchema),
      changesApplied: z.array(z.string()),
      report: z.string(),
   }),
})
   .then(seoAnalyzeStep)
   .then(seoApplyFixesStep)
   .commit();
```

**Step 2: Typecheck + commit**

```bash
bun run typecheck 2>&1 | grep -E "seo-audit|error" | head -10
git add packages/agents/src/mastra/workflows/seo-audit-workflow.ts
git commit -m "feat(agents): add seo-audit-workflow — analyze then apply fixes, typed score output"
```

---

### Task 4: GEO Optimize Workflow

**Files:**
- Create: `packages/agents/src/mastra/workflows/geo-optimize-workflow.ts`

**Step 1: Create the workflow**

```typescript
// packages/agents/src/mastra/workflows/geo-optimize-workflow.ts
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { reviewerAgent } from "../agents/reviewer-agent";
import { writerAgent } from "../agents/writer-agent";

const geoAnalyzeStep = createStep({
   id: "geo-analyze",
   inputSchema: z.object({}),
   outputSchema: z.object({
      analysis: z.string(),
      missingPatterns: z.array(z.string()),
      uncitedClaims: z.array(z.string()),
   }),
   execute: async ({ requestContext }) => {
      const result = await reviewerAgent.generate(
         [
            "Perform a GEO (Generative Engine Optimization) analysis applying the otimizacao-geo skill.",
            "Check for: 1) Missing Definition Block in first section",
            "2) Paragraphs that are NOT self-contained",
            "3) Statistics/claims without a specific page URL (domain roots don't count)",
            "4) Missing FAQ section (4-6 Q&A before conclusion)",
            "5) Missing Quick Answer / TL;DR in first 100 words",
            "",
            "Output under these exact headings:",
            "## Missing GEO Patterns",
            "## Uncited Claims",
            "## Recommendations",
         ].join("\n"),
         { requestContext },
      );

      const extract = (heading: string) =>
         (result.text.match(new RegExp(`## ${heading}([\\s\\S]*?)(?=## |$)`, "i"))?.[1] ?? "")
            .split("\n")
            .filter((l) => l.trim().startsWith("-"))
            .map((l) => l.replace(/^-\s*/, "").trim());

      return {
         analysis: result.text,
         missingPatterns: extract("Missing GEO Patterns"),
         uncitedClaims: extract("Uncited Claims"),
      };
   },
});

const geoApplyStep = createStep({
   id: "geo-apply",
   inputSchema: z.object({
      analysis: z.string(),
      missingPatterns: z.array(z.string()),
      uncitedClaims: z.array(z.string()),
   }),
   outputSchema: z.object({
      analysis: z.string(),
      missingPatterns: z.array(z.string()),
      uncitedClaims: z.array(z.string()),
      changesApplied: z.array(z.string()),
   }),
   execute: async ({ inputData, requestContext }) => {
      const patternList = inputData.missingPatterns.map((p) => `- ${p}`).join("\n");
      const result = await writerAgent.generate(
         [
            "Apply GEO improvements to the current content using the otimizacao-geo skill.",
            `Missing patterns to fix:\n${patternList || "- None identified"}`,
            "",
            "Apply improvements:",
            "1. If Definition Block missing → insertText a self-contained definition in the first section",
            "2. If Quick Answer missing → use generateQuickAnswer tool",
            "3. If FAQ missing or < 4 Q&A → insertText 4-6 Q&A before conclusion",
            "4. If comparison data exists → insertTable",
            "5. For uncited claims → addEditorComment 'GEO: This claim needs a specific source URL'",
            "",
            "List each change under: ## GEO Changes Applied",
         ].join("\n"),
         { requestContext },
      );

      const changesSection =
         result.text.match(/## GEO Changes Applied([\s\S]*?)(?=## |$)/i)?.[1] ?? "";
      const changesApplied = changesSection
         .split("\n")
         .filter((l) => l.trim().startsWith("-"))
         .map((l) => l.replace(/^-\s*/, "").trim());

      return { ...inputData, changesApplied };
   },
});

export const geoOptimizeWorkflow = createWorkflow({
   id: "geo-optimize",
   inputSchema: z.object({}),
   outputSchema: z.object({
      analysis: z.string(),
      missingPatterns: z.array(z.string()),
      uncitedClaims: z.array(z.string()),
      changesApplied: z.array(z.string()),
   }),
})
   .then(geoAnalyzeStep)
   .then(geoApplyStep)
   .commit();
```

**Step 2: Typecheck + commit**

```bash
bun run typecheck 2>&1 | grep -E "geo-optimize|error" | head -10
git add packages/agents/src/mastra/workflows/geo-optimize-workflow.ts
git commit -m "feat(agents): add geo-optimize-workflow — GEO analysis + definition blocks, FAQ, citation fixes"
```

---

### Task 5: Research Workflow

**Files:**
- Create: `packages/agents/src/mastra/workflows/research-workflow.ts`

**Step 1: Create the workflow**

```typescript
// packages/agents/src/mastra/workflows/research-workflow.ts
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { researchAgent } from "../agents/research-agent";

const researchStep = createStep({
   id: "research",
   inputSchema: z.object({ topic: z.string() }),
   outputSchema: z.object({ briefing: z.string(), topic: z.string() }),
   execute: async ({ inputData, requestContext }) => {
      const result = await researchAgent.generate(
         [
            `Research this topic thoroughly: "${inputData.topic}"`,
            "Follow the pesquisa-de-conteudo skill:",
            "1. searchPreviousContent — check existing coverage",
            "2. serpAnalysis — top-10 SERP landscape",
            "3. competitorContent — what top competitors cover",
            "4. contentGap — angles competitors miss",
            "5. relatedKeywords — keyword clusters",
            "6. factFinder — supporting data with specific source URLs",
            "7. researchCompleteness — validate thoroughness",
            "",
            "Deliver a structured briefing: Executive Summary, Key Findings (with source URLs), Keyword Strategy, Recommended H2/H3 Structure, Gaps and Opportunities.",
         ].join("\n"),
         { requestContext },
      );
      return { briefing: result.text, topic: inputData.topic };
   },
});

const setFrontmatterStep = createStep({
   id: "set-frontmatter",
   inputSchema: z.object({ briefing: z.string(), topic: z.string() }),
   outputSchema: z.object({ briefing: z.string(), topic: z.string(), frontmatterSet: z.boolean() }),
   execute: async ({ inputData, requestContext }) => {
      await researchAgent.generate(
         `Based on this research briefing, set frontmatter using gestao-de-frontmatter skill. Call editTitle, editDescription, editKeywords, editSlug in that order.\n\nBriefing:\n${inputData.briefing}`,
         { requestContext },
      );
      return { ...inputData, frontmatterSet: true };
   },
});

export const researchWorkflow = createWorkflow({
   id: "research",
   inputSchema: z.object({ topic: z.string() }),
   outputSchema: z.object({ briefing: z.string(), topic: z.string(), frontmatterSet: z.boolean() }),
})
   .then(researchStep)
   .then(setFrontmatterStep)
   .commit();
```

**Step 2: Typecheck + commit**

```bash
bun run typecheck 2>&1 | grep -E "research-workflow|error" | head -10
git add packages/agents/src/mastra/workflows/research-workflow.ts
git commit -m "feat(agents): add research-workflow — SERP + competitors + gaps + frontmatter"
```

---

### Task 6: Content Review Workflow

**Files:**
- Create: `packages/agents/src/mastra/workflows/content-review-workflow.ts`

**Step 1: Create the workflow**

```typescript
// packages/agents/src/mastra/workflows/content-review-workflow.ts
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { reviewerAgent } from "../agents/reviewer-agent";
import { seoAuditorAgent } from "../agents/seo-auditor-agent";
import { writerAgent } from "../agents/writer-agent";
import { parseReviewSignal, parseSeoScore } from "./utils";

const reviewCycleStep = createStep({
   id: "review-cycle",
   inputSchema: z.object({}),
   outputSchema: z.object({
      approved: z.boolean(),
      issues: z.array(z.string()),
      seoScore: z.number(),
      feedback: z.string(),
   }),
   execute: async ({ requestContext }) => {
      const [reviewResult, seoResult] = await Promise.all([
         reviewerAgent.generate(
            "Review the article using the revisao-de-conteudo skill. Check: structure, quality, tone, readability, fact-checking, AI-sounding patterns. Apply corrections using proposeSuggestion or replaceText. End with: REVIEW_SIGNAL: {\"approved\": true/false, \"issues\": [...]}",
            { requestContext },
         ),
         seoAuditorAgent.generate(
            "Run seoScore. Report Overall Score: X/100 and top 3 issues. Do NOT apply fixes.",
            { requestContext },
         ),
      ]);

      const { approved, issues } = parseReviewSignal(reviewResult.text);
      const seoScore = parseSeoScore(seoResult.text);
      const feedback = `${reviewResult.text}\n\n---\nSEO Snapshot:\n${seoResult.text}`;

      if (!approved) {
         await writerAgent.generate(
            `Revise the article based on this feedback:\n\n${feedback}`,
            { requestContext },
         );
      }

      return { approved, issues, seoScore, feedback };
   },
});

export const contentReviewWorkflow = createWorkflow({
   id: "content-review",
   inputSchema: z.object({}),
   outputSchema: z.object({
      approved: z.boolean(),
      issues: z.array(z.string()),
      seoScore: z.number(),
      feedback: z.string(),
   }),
})
   .dowhile(
      reviewCycleStep,
      async ({ inputData, iterationCount }) => !inputData.approved && iterationCount < 2,
   )
   .commit();
```

**Step 2: Typecheck + commit**

```bash
bun run typecheck 2>&1 | grep -E "content-review|error" | head -10
git add packages/agents/src/mastra/workflows/content-review-workflow.ts
git commit -m "feat(agents): add content-review-workflow — review + SEO parallel, revise loop max 2x"
```

---

### Task 7: Competitor Analysis Workflow

**Files:**
- Create: `packages/agents/src/mastra/workflows/competitor-analysis-workflow.ts`

**Step 1: Create the workflow**

```typescript
// packages/agents/src/mastra/workflows/competitor-analysis-workflow.ts
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { researchAgent } from "../agents/research-agent";

const serpCompetitorStep = createStep({
   id: "serp-competitor",
   inputSchema: z.object({ keyword: z.string() }),
   outputSchema: z.object({ keyword: z.string(), landscape: z.string() }),
   execute: async ({ inputData, requestContext }) => {
      const result = await researchAgent.generate(
         [
            `Analyze the competitive landscape for: "${inputData.keyword}"`,
            "1. serpAnalysis — map the top-10 SERP (intent, format, word count, featured snippets)",
            "2. competitorContent — deep-dive top 3 ranking pages",
            "3. relatedKeywords — keyword clusters and long-tail opportunities",
            "",
            "Output: ## SERP Overview, ## Top Competitor Breakdown (one per competitor), ## Keyword Clusters",
         ].join("\n"),
         { requestContext },
      );
      return { keyword: inputData.keyword, landscape: result.text };
   },
});

const contentGapStep = createStep({
   id: "content-gap",
   inputSchema: z.object({ keyword: z.string(), landscape: z.string() }),
   outputSchema: z.object({
      keyword: z.string(),
      landscape: z.string(),
      gaps: z.string(),
      opportunities: z.array(z.string()),
   }),
   execute: async ({ inputData, requestContext }) => {
      const result = await researchAgent.generate(
         [
            "Based on the competitive landscape, find content gaps using the contentGap tool.",
            `Landscape:\n${inputData.landscape}`,
            "",
            "Output: ## Content Gaps, ## Quick Win Opportunities, ## Recommended Article Ideas (3-5 titles)",
         ].join("\n"),
         { requestContext },
      );

      const opportunities = (
         result.text.match(/## Recommended Article Ideas([\s\S]*?)(?=## |$)/i)?.[1] ?? ""
      )
         .split("\n")
         .filter((l) => l.trim().match(/^\d+\.|^-/))
         .map((l) => l.replace(/^\d+\.\s*|-\s*/, "").trim())
         .filter(Boolean);

      return { ...inputData, gaps: result.text, opportunities };
   },
});

export const competitorAnalysisWorkflow = createWorkflow({
   id: "competitor-analysis",
   inputSchema: z.object({ keyword: z.string() }),
   outputSchema: z.object({
      keyword: z.string(),
      landscape: z.string(),
      gaps: z.string(),
      opportunities: z.array(z.string()),
   }),
})
   .then(serpCompetitorStep)
   .then(contentGapStep)
   .commit();
```

**Step 2: Typecheck + commit**

```bash
bun run typecheck 2>&1 | grep -E "competitor|error" | head -10
git add packages/agents/src/mastra/workflows/competitor-analysis-workflow.ts
git commit -m "feat(agents): add competitor-analysis-workflow — SERP landscape + gap report"
```

---

### Task 8: Keyword Strategy Workflow

**Files:**
- Create: `packages/agents/src/mastra/workflows/keyword-strategy-workflow.ts`

**Step 1: Create the workflow**

```typescript
// packages/agents/src/mastra/workflows/keyword-strategy-workflow.ts
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { researchAgent } from "../agents/research-agent";

const keywordDiscoveryStep = createStep({
   id: "keyword-discovery",
   inputSchema: z.object({ topic: z.string() }),
   outputSchema: z.object({ topic: z.string(), discovery: z.string() }),
   execute: async ({ inputData, requestContext }) => {
      const [serpResult, relatedResult] = await Promise.all([
         researchAgent.generate(
            `serpAnalysis for: "${inputData.topic}" — identify search intent, volume signals, SERP features, primary keyword`,
            { requestContext },
         ),
         researchAgent.generate(
            `relatedKeywords for: "${inputData.topic}" — find long-tail variations, question keywords, semantic clusters`,
            { requestContext },
         ),
      ]);
      return {
         topic: inputData.topic,
         discovery: `## SERP Analysis\n${serpResult.text}\n\n## Related Keywords\n${relatedResult.text}`,
      };
   },
});

const keywordClusterStep = createStep({
   id: "keyword-cluster",
   inputSchema: z.object({ topic: z.string(), discovery: z.string() }),
   outputSchema: z.object({
      primaryKeyword: z.string(),
      clusters: z.array(z.object({ theme: z.string(), keywords: z.array(z.string()) })),
      suggestedTitles: z.array(z.string()),
      strategy: z.string(),
   }),
   execute: async ({ inputData, requestContext }) => {
      const result = await researchAgent.generate(
         [
            "Build a keyword strategy from the research below.",
            `Research:\n${inputData.discovery}`,
            "",
            "Deliver:",
            "## Primary Keyword: [single best keyword]",
            "## Keyword Clusters (3-5 clusters, each with theme + keywords)",
            "## Suggested Article Titles (5 titles)",
            "## Content Strategy Summary (2-3 sentences)",
         ].join("\n"),
         { requestContext },
      );

      const primaryMatch = result.text.match(/## Primary Keyword:\s*(.+)/i);
      const primaryKeyword = primaryMatch?.[1]?.trim() ?? inputData.topic;

      const titlesSection =
         result.text.match(/## Suggested Article Titles([\s\S]*?)(?=## |$)/i)?.[1] ?? "";
      const suggestedTitles = titlesSection
         .split("\n")
         .filter((l) => l.trim().startsWith("-"))
         .map((l) => l.replace(/^-\s*/, "").trim())
         .filter(Boolean);

      return { primaryKeyword, clusters: [], suggestedTitles, strategy: result.text };
   },
});

export const keywordStrategyWorkflow = createWorkflow({
   id: "keyword-strategy",
   inputSchema: z.object({ topic: z.string() }),
   outputSchema: z.object({
      primaryKeyword: z.string(),
      clusters: z.array(z.object({ theme: z.string(), keywords: z.array(z.string()) })),
      suggestedTitles: z.array(z.string()),
      strategy: z.string(),
   }),
})
   .then(keywordDiscoveryStep)
   .then(keywordClusterStep)
   .commit();
```

**Step 2: Typecheck + commit**

```bash
bun run typecheck 2>&1 | grep -E "keyword-strategy|error" | head -10
git add packages/agents/src/mastra/workflows/keyword-strategy-workflow.ts
git commit -m "feat(agents): add keyword-strategy-workflow — SERP + clusters + title suggestions"
```

---

### Task 9: Register All Workflows + Extend Context

**Files:**
- Modify: `packages/agents/src/mastra/index.ts`

**Step 1: Add workflow imports** (after the existing `contentCreationWorkflow` import line):

```typescript
import { competitorAnalysisWorkflow } from "./workflows/competitor-analysis-workflow";
import { contentReviewWorkflow } from "./workflows/content-review-workflow";
import { geoOptimizeWorkflow } from "./workflows/geo-optimize-workflow";
import { keywordStrategyWorkflow } from "./workflows/keyword-strategy-workflow";
import { researchWorkflow } from "./workflows/research-workflow";
import { seoAuditWorkflow } from "./workflows/seo-audit-workflow";
```

**Step 2: Update the `Mastra` constructor `workflows` field**:

```typescript
workflows: {
   contentCreationWorkflow,
   seoAuditWorkflow,
   geoOptimizeWorkflow,
   researchWorkflow,
   contentReviewWorkflow,
   competitorAnalysisWorkflow,
   keywordStrategyWorkflow,
},
```

**Step 3: Extend `CustomRequestContext` type** (add after `contentId?: string`):

```typescript
/** Product surface that triggered this request */
route?: "editor" | "chat" | "content-list" | "seo-dashboard" | "workflow";
/** Active team ID */
teamId?: string;
/** Active brand ID */
brandId?: string;
```

**Step 4: Set new fields in `createRequestContext`** (add after the `contentId` block):

```typescript
if (context.route) requestContext.set("route", context.route);
if (context.teamId) requestContext.set("teamId", context.teamId);
if (context.brandId) requestContext.set("brandId", context.brandId);
```

**Step 5: Add exports and the workflow ID whitelist** at the bottom of the file:

```typescript
export { seoAuditWorkflow } from "./workflows/seo-audit-workflow";
export { geoOptimizeWorkflow } from "./workflows/geo-optimize-workflow";
export { researchWorkflow } from "./workflows/research-workflow";
export { contentReviewWorkflow } from "./workflows/content-review-workflow";
export { competitorAnalysisWorkflow } from "./workflows/competitor-analysis-workflow";
export { keywordStrategyWorkflow } from "./workflows/keyword-strategy-workflow";

export const WORKFLOW_IDS = [
   "content-creation",
   "seo-audit",
   "geo-optimize",
   "research",
   "content-review",
   "competitor-analysis",
   "keyword-strategy",
] as const;

export type WorkflowId = (typeof WORKFLOW_IDS)[number];
```

**Step 6: Update the platform router instructions** in `packages/agents/src/mastra/agents/platform-router-agent.ts` — add a workflow table to the existing instructions block:

```typescript
// Inside getPlatformRouterInstructions, replace the ## YOUR AGENTS + ## ROUTING RULES sections with:

## AVAILABLE WORKFLOWS

| Workflow ID | Trigger examples |
|---|---|
| seo-audit | "audite meu SEO", "SEO score", "cheque meu título e meta" |
| geo-optimize | "otimize para IA", "GEO", "quero ser citado pelo ChatGPT" |
| research | "pesquise sobre X", "briefing sobre X", "planeje conteúdo sobre X" |
| content-review | "revise este artigo", "revisão de qualidade", "verifique meu conteúdo" |
| competitor-analysis | "analise concorrentes para X", "o que ranqueia para X" |
| keyword-strategy | "estratégia de keywords para X", "quais palavras-chave devo usar" |
| content-creation | "escreva um artigo completo sobre X", "crie conteúdo sobre X" |

Workflows are deterministic pipelines — they run via the toolbar buttons or when the user's chat intent clearly maps to one.
For workflow-intent requests, route to content-agent AND inform the user that the relevant workflow button is available in the editor toolbar.

## YOUR AGENTS

**content-agent** — Content Domain Agent
Use when: freeform content tasks that don't clearly map to a workflow above.

## ROUTING RULES

1. **Content request** → content-agent (pass full message including prefixes)
2. **Platform question** → answer directly
3. **Prefixed request** (e.g., "[Usar writer-agent]:") → content-agent
4. **Clear workflow intent** → content-agent + mention toolbar button

## IMPORTANT

- You DO NOT have tools yourself — content-agent and its specialists do
- **Relay the content-agent's response as-is.** DO NOT add article content, frontmatter, or summaries.
```

**Step 7: Typecheck + commit**

```bash
bun run typecheck 2>&1 | head -20
git add packages/agents/src/mastra/index.ts packages/agents/src/mastra/agents/platform-router-agent.ts
git commit -m "feat(agents): register 6 workflows, export WORKFLOW_IDS, extend CustomRequestContext, update router"
```

---

## Phase 3 — API Layer

### Task 10: Add `executeWorkflow` oRPC Procedure

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/agent.ts`

**Step 1: Add imports** after the existing imports in `agent.ts`:

```typescript
import { type WorkflowId, WORKFLOW_IDS } from "@packages/agents";
```

**Step 2: Add the `executeWorkflow` procedure** before the helpers section at the bottom:

```typescript
/**
 * Execute a named workflow. Returns the typed final output.
 * Used by UI workflow trigger buttons.
 */
export const executeWorkflow = protectedProcedure
   .input(
      z.object({
         workflowId: z.enum(WORKFLOW_IDS as unknown as [string, ...string[]]),
         contentId: z.string().uuid().optional(),
         writerId: z.string().uuid().optional(),
         input: z.record(z.string(), z.unknown()).default({}),
         model: z.string().optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { userId, db, organizationId, posthog, teamId, headers } = context;

      await enforceCreditBudget(db, organizationId, "ai");

      const settings = await getProductSettings(db, teamId);
      const aiDefaults = settings?.aiDefaults ?? {};

      let writerInstructions: InstructionMemoryItem[] | undefined;
      if (input.writerId) {
         const writerRecord = await db.query.writer.findFirst({
            where: and(eq(writer.id, input.writerId), eq(writer.teamId, teamId)),
         });
         if (writerRecord?.instructionMemories) {
            writerInstructions = (
               writerRecord.instructionMemories as InstructionMemoryItem[]
            ).slice(0, 10);
         }
      }

      const contentModelId = (input.model ??
         aiDefaults.contentModel ??
         DEFAULT_CONTENT_MODEL_ID) as ContentModelId;
      const contentPreset = getModelPreset(CONTENT_MODELS, contentModelId, DEFAULT_CONTENT_MODEL_ID);

      const requestContext = createRequestContext({
         userId,
         contentId: input.contentId,
         writerId: input.writerId,
         writerInstructions,
         teamId,
         route: "workflow",
         language: aiDefaults.defaultLanguage ?? getRequestLanguage(headers) ?? "pt-BR",
         model: contentModelId,
         temperature: aiDefaults.contentTemperature ?? contentPreset.temperature,
         topP: contentPreset.topP,
         maxTokens: aiDefaults.contentMaxTokens ?? contentPreset.maxTokens,
         frequencyPenalty: contentPreset.frequencyPenalty,
         presencePenalty: contentPreset.presencePenalty,
      } as CustomRequestContext);

      const startTime = Date.now();
      const workflow = mastra.getWorkflow(input.workflowId as WorkflowId);
      const run = workflow.createRun();
      const result = await run.start({
         triggerData: input.input,
         requestContext: requestContext as RequestContext<unknown>,
      });
      const latencyMs = Date.now() - startTime;

      try {
         await emitAiAgentAction(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            {
               agentId: input.workflowId,
               contentId: input.contentId,
               action: "workflow",
               model: contentModelId,
               provider: "openrouter",
               promptTokens: 0,
               completionTokens: 0,
               totalTokens: 0,
               latencyMs,
            },
         );
         await trackCreditUsage(db, AI_EVENTS["ai.agent_action"], organizationId, "ai");
      } catch {
         // tracking must not break the flow
      }

      return {
         workflowId: input.workflowId,
         result: result.result as Record<string, unknown>,
         status: result.status,
      };
   });
```

**Step 3: Export from the router barrel** — find the file exporting all agent procedures:

```bash
grep -r "executeUnifiedAgent" apps/web/src/integrations/orpc --include="*.ts" -l
```

Add to that file: `export { executeWorkflow } from "./router/agent";`

**Step 4: Typecheck + commit**

```bash
bun run typecheck 2>&1 | head -20
git add apps/web/src/integrations/orpc/router/agent.ts
git commit -m "feat(api): add executeWorkflow oRPC procedure with credit tracking"
```

---

## Phase 4 — Beautiful Tool UI (from agentic-ui-tool-components.md)

> **Note:** Tasks A1–A6 in `docs/plans/2026-02-27-agentic-ui-tool-components.md` cover: tool display config, AgentCallTool, EditorTool, ResearchTool, ToolFallback label update, and thread.tsx registration. Complete those tasks in full before continuing to Phase 5. They share no file dependencies with Phases 1–3 and can run in parallel.

---

## Phase 5 — Workflow-Specific Beautiful UI

This phase adds three new UI pieces:
1. **`WorkflowResultCard`** — Claude-style expandable result card for when a workflow completes
2. **`WorkflowTriggerPanel`** — Premium Perplexity/Claude-style trigger buttons in the editor toolbar
3. **Workflow step progress** baked into the `WorkflowResultCard` loading state

### Task 11: WorkflowResultCard Component

**Files:**
- Create: `apps/web/src/features/editor/ui/workflow-result-card.tsx`

Inspired by Claude AI's result panels: a card with a colored left border per workflow type, an icon, a summary line, and an expandable details section.

**Step 1: Create the component**

```tsx
// apps/web/src/features/editor/ui/workflow-result-card.tsx
import {
   BarChart2,
   CheckCircle,
   ChevronDown,
   Globe,
   Hash,
   Loader2,
   Search,
   TrendingUp,
   XCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@packages/ui/lib/utils";
import { Button } from "@packages/ui/components/button";

// ─── Config ──────────────────────────────────────────────────────────────────

type WorkflowMeta = {
   icon: React.ReactNode;
   label: string;
   color: string;         // Tailwind border-* class
   bgColor: string;       // Tailwind bg-* class
   iconColor: string;     // Tailwind text-* class
};

const WORKFLOW_META: Record<string, WorkflowMeta> = {
   "seo-audit": {
      icon: <BarChart2 className="size-4" />,
      label: "Auditoria SEO",
      color: "border-blue-500/40",
      bgColor: "bg-blue-500/5",
      iconColor: "text-blue-500",
   },
   "geo-optimize": {
      icon: <Globe className="size-4" />,
      label: "Otimização GEO",
      color: "border-violet-500/40",
      bgColor: "bg-violet-500/5",
      iconColor: "text-violet-500",
   },
   "content-review": {
      icon: <CheckCircle className="size-4" />,
      label: "Revisão de Conteúdo",
      color: "border-emerald-500/40",
      bgColor: "bg-emerald-500/5",
      iconColor: "text-emerald-500",
   },
   research: {
      icon: <Search className="size-4" />,
      label: "Pesquisa",
      color: "border-amber-500/40",
      bgColor: "bg-amber-500/5",
      iconColor: "text-amber-500",
   },
   "competitor-analysis": {
      icon: <TrendingUp className="size-4" />,
      label: "Análise de Concorrentes",
      color: "border-orange-500/40",
      bgColor: "bg-orange-500/5",
      iconColor: "text-orange-500",
   },
   "keyword-strategy": {
      icon: <Hash className="size-4" />,
      label: "Estratégia de Keywords",
      color: "border-cyan-500/40",
      bgColor: "bg-cyan-500/5",
      iconColor: "text-cyan-500",
   },
};

// ─── Summary Builders ─────────────────────────────────────────────────────────

function buildSummary(workflowId: string, result: Record<string, unknown>): React.ReactNode {
   switch (workflowId) {
      case "seo-audit": {
         const before = result.scoreBefore as number;
         const after = result.scoreAfter as number;
         const changes = (result.changesApplied as string[])?.length ?? 0;
         const delta = after - before;
         return (
            <span className="flex items-baseline gap-2">
               <span className="font-mono text-sm font-semibold">
                  {before}
                  <span className="mx-1 text-muted-foreground">→</span>
                  <span className={cn(delta >= 0 ? "text-emerald-500" : "text-red-500")}>
                     {after}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">/100</span>
               </span>
               <span className="text-xs text-muted-foreground">· {changes} melhorias aplicadas</span>
            </span>
         );
      }
      case "geo-optimize": {
         const changes = (result.changesApplied as string[])?.length ?? 0;
         const missing = (result.missingPatterns as string[])?.length ?? 0;
         return (
            <span className="text-sm text-muted-foreground">
               {changes} blocos citáveis adicionados · {missing} padrões identificados
            </span>
         );
      }
      case "content-review": {
         const approved = result.approved as boolean;
         const score = result.seoScore as number;
         return (
            <span className="flex items-center gap-2 text-sm">
               {approved ? (
                  <span className="text-emerald-500 font-medium">Aprovado</span>
               ) : (
                  <span className="text-amber-500 font-medium">Com sugestões</span>
               )}
               <span className="text-muted-foreground">· SEO {score}/100</span>
            </span>
         );
      }
      case "research": {
         return (
            <span className="text-sm text-muted-foreground">
               Briefing gerado · Frontmatter aplicado
            </span>
         );
      }
      case "competitor-analysis": {
         const opps = (result.opportunities as string[])?.length ?? 0;
         return (
            <span className="text-sm text-muted-foreground">
               {opps} oportunidades identificadas
            </span>
         );
      }
      case "keyword-strategy": {
         const titles = (result.suggestedTitles as string[])?.length ?? 0;
         const primary = result.primaryKeyword as string;
         return (
            <span className="text-sm text-muted-foreground">
               Primary: <span className="font-medium text-foreground">{primary}</span>
               {" · "}{titles} títulos sugeridos
            </span>
         );
      }
      default:
         return <span className="text-sm text-muted-foreground">Concluído</span>;
   }
}

function buildDetails(workflowId: string, result: Record<string, unknown>): React.ReactNode {
   switch (workflowId) {
      case "seo-audit": {
         const changes = result.changesApplied as string[];
         const issues = result.issues as Array<{ priority: string; description: string }>;
         return (
            <div className="space-y-3">
               {issues?.filter((i) => i.priority === "High").length > 0 && (
                  <div>
                     <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Issues de Alta Prioridade
                     </p>
                     <ul className="space-y-1">
                        {issues.filter((i) => i.priority === "High").map((issue, i) => (
                           // biome-ignore lint/suspicious/noArrayIndexKey: static list
                           <li key={`high-${i + 1}`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                              {issue.description}
                           </li>
                        ))}
                     </ul>
                  </div>
               )}
               {changes?.length > 0 && (
                  <div>
                     <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Melhorias Aplicadas
                     </p>
                     <ul className="space-y-1">
                        {changes.slice(0, 8).map((c, i) => (
                           // biome-ignore lint/suspicious/noArrayIndexKey: static list
                           <li key={`change-${i + 1}`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                              {c}
                           </li>
                        ))}
                     </ul>
                  </div>
               )}
            </div>
         );
      }
      case "keyword-strategy": {
         const titles = result.suggestedTitles as string[];
         return (
            <div>
               <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Títulos Sugeridos
               </p>
               <ul className="space-y-1">
                  {titles?.map((t, i) => (
                     // biome-ignore lint/suspicious/noArrayIndexKey: static list
                     <li key={`title-${i + 1}`} className="text-xs text-muted-foreground">
                        {i + 1}. {t}
                     </li>
                  ))}
               </ul>
            </div>
         );
      }
      default:
         return null;
   }
}

// ─── Component ────────────────────────────────────────────────────────────────

type WorkflowResultCardProps = {
   workflowId: string;
   result: Record<string, unknown>;
   isPending?: boolean;
   error?: string;
};

export function WorkflowResultCard({
   workflowId,
   result,
   isPending = false,
   error,
}: WorkflowResultCardProps) {
   const [expanded, setExpanded] = useState(false);
   const meta = WORKFLOW_META[workflowId];
   const details = buildDetails(workflowId, result);
   const hasDetails = !!details;

   return (
      <div
         className={cn(
            "rounded-lg border-l-2 bg-card px-4 py-3 shadow-sm transition-all",
            meta?.color ?? "border-border",
            meta?.bgColor ?? "bg-muted/10",
         )}
      >
         {/* Header row */}
         <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
               {/* Icon */}
               <span
                  className={cn(
                     "flex size-7 shrink-0 items-center justify-center rounded-full",
                     meta?.bgColor ?? "bg-muted",
                     meta?.iconColor ?? "text-muted-foreground",
                  )}
               >
                  {isPending ? (
                     <Loader2 className="size-3.5 animate-spin" />
                  ) : error ? (
                     <XCircle className="size-3.5 text-destructive" />
                  ) : (
                     meta?.icon
                  )}
               </span>

               {/* Label + summary */}
               <div className="min-w-0">
                  <p className="text-xs font-semibold leading-none text-foreground/70">
                     {meta?.label ?? workflowId}
                  </p>
                  <div className="mt-1">
                     {isPending ? (
                        <span className="text-xs text-muted-foreground animate-pulse">
                           Processando…
                        </span>
                     ) : error ? (
                        <span className="text-xs text-destructive">{error}</span>
                     ) : (
                        buildSummary(workflowId, result)
                     )}
                  </div>
               </div>
            </div>

            {/* Expand toggle */}
            {hasDetails && !isPending && !error && (
               <Button
                  className="size-6 shrink-0 rounded-full"
                  onClick={() => setExpanded((v) => !v)}
                  size="icon"
                  variant="ghost"
               >
                  <ChevronDown
                     className={cn(
                        "size-3.5 transition-transform duration-200",
                        expanded && "rotate-180",
                     )}
                  />
               </Button>
            )}
         </div>

         {/* Expandable details */}
         {expanded && hasDetails && (
            <div className="mt-3 border-t border-border/50 pt-3">{details}</div>
         )}
      </div>
   );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "workflow-result|error" | head -10
```

**Step 3: Commit**

```bash
git add apps/web/src/features/editor/ui/workflow-result-card.tsx
git commit -m "feat(ui): add WorkflowResultCard — Claude-style expandable result cards per workflow type"
```

---

### Task 12: Premium WorkflowTriggerPanel

**Files:**
- Create: `apps/web/src/features/editor/ui/workflow-trigger-panel.tsx`

Inspired by Perplexity's action buttons: icon pills with subtle gradient hover, loading ring animation, toast with `WorkflowResultCard`.

**Step 1: Create the component**

```tsx
// apps/web/src/features/editor/ui/workflow-trigger-panel.tsx
import { useMutation } from "@tanstack/react-query";
import { BarChart2, CheckCircle, Globe } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@packages/ui/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@packages/ui/components/tooltip";
import { orpc } from "@/integrations/orpc/client";
import { WorkflowResultCard } from "./workflow-result-card";

type WorkflowDef = {
   id: string;
   label: string;
   description: string;
   icon: React.ReactNode;
   accentClass: string;   // hover ring color
   input?: Record<string, unknown>;
};

const WORKFLOWS: WorkflowDef[] = [
   {
      id: "seo-audit",
      label: "SEO",
      description: "Auditar e aplicar melhorias de SEO automaticamente",
      icon: <BarChart2 className="size-3.5" />,
      accentClass: "hover:ring-blue-500/30 data-[active=true]:ring-blue-500/50",
   },
   {
      id: "geo-optimize",
      label: "GEO",
      description: "Adicionar blocos citáveis para ChatGPT, Perplexity e Google AI",
      icon: <Globe className="size-3.5" />,
      accentClass: "hover:ring-violet-500/30 data-[active=true]:ring-violet-500/50",
   },
   {
      id: "content-review",
      label: "Revisar",
      description: "Revisão completa: qualidade, tom, citações, legibilidade e SEO",
      icon: <CheckCircle className="size-3.5" />,
      accentClass: "hover:ring-emerald-500/30 data-[active=true]:ring-emerald-500/50",
   },
];

type Props = { contentId: string; writerId?: string };

export function WorkflowTriggerPanel({ contentId, writerId }: Props) {
   const mutation = useMutation(
      orpc.agent.executeWorkflow.mutationOptions({
         onSuccess: (data) => {
            toast.custom(
               () => (
                  <WorkflowResultCard
                     workflowId={data.workflowId}
                     result={data.result}
                  />
               ),
               { duration: 8000 },
            );
         },
         onError: (error) => {
            toast.error("Workflow falhou", { description: error.message });
         },
      }),
   );

   const runningId = mutation.isPending ? mutation.variables?.workflowId : null;

   return (
      <div className="flex items-center gap-1" role="toolbar" aria-label="Workflows rápidos">
         {WORKFLOWS.map((wf) => {
            const isActive = runningId === wf.id;

            return (
               <Tooltip key={wf.id}>
                  <TooltipTrigger asChild>
                     <button
                        aria-label={wf.label}
                        data-active={isActive}
                        disabled={mutation.isPending}
                        onClick={() =>
                           mutation.mutate({
                              workflowId: wf.id,
                              contentId,
                              writerId,
                              input: wf.input ?? {},
                           })
                        }
                        type="button"
                        className={cn(
                           // Base pill
                           "relative flex h-7 items-center gap-1.5 rounded-full border border-border/60 px-3 text-xs font-medium",
                           "bg-background text-muted-foreground",
                           "ring-2 ring-transparent transition-all duration-150",
                           "hover:border-border hover:bg-accent hover:text-foreground",
                           "disabled:cursor-not-allowed disabled:opacity-50",
                           // Accent ring on hover/active
                           wf.accentClass,
                        )}
                     >
                        {/* Loading ring */}
                        {isActive && (
                           <span
                              aria-hidden
                              className="absolute inset-0 rounded-full ring-2 ring-current animate-ping opacity-20"
                           />
                        )}

                        {/* Spinner or icon */}
                        {isActive ? (
                           <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : (
                           wf.icon
                        )}

                        {wf.label}
                     </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-52">
                     <p className="text-xs">{wf.description}</p>
                  </TooltipContent>
               </Tooltip>
            );
         })}
      </div>
   );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "workflow-trigger|error" | head -10
```

**Step 3: Commit**

```bash
git add apps/web/src/features/editor/ui/workflow-trigger-panel.tsx
git commit -m "feat(ui): add WorkflowTriggerPanel — premium pill buttons with loading ring + result toast"
```

---

### Task 13: Mount WorkflowTriggerPanel in Editor Toolbar

**Files:**
- Modify: `apps/web/src/features/editor/ui/editor-fixed-toolbar.tsx`

**Step 1: Read the current toolbar file**

```bash
head -60 apps/web/src/features/editor/ui/editor-fixed-toolbar.tsx
```

Note which props the toolbar receives (contentId, writerId are needed).

**Step 2: Add import + mount**

Add at the top of the file:
```typescript
import { WorkflowTriggerPanel } from "./workflow-trigger-panel";
```

Inside the toolbar JSX, add `<WorkflowTriggerPanel>` in a logical position — after the main editing action buttons, before the right-side settings/mode buttons. Wrap in a `<div className="flex items-center gap-1.5">` if needed for spacing. The toolbar already separates sections with dividers (`<Separator orientation="vertical" />`), so add one before the panel:

```tsx
<Separator orientation="vertical" className="mx-1 h-5" />
<WorkflowTriggerPanel contentId={contentId} writerId={writerId} />
```

(The exact names `contentId` and `writerId` depend on the current toolbar props — inspect the file before adding.)

**Step 3: Typecheck**

```bash
bun run typecheck 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add apps/web/src/features/editor/ui/editor-fixed-toolbar.tsx
git commit -m "feat(ui): mount WorkflowTriggerPanel in editor fixed toolbar"
```

---

### Task 14: Update Chat Quick Suggestions

**Files:**
- Modify: `apps/web/src/features/context-panel/ui/teco-chat-tab.tsx`

**Step 1: Replace the `QUICK_SUGGESTIONS` array**

Current:
```typescript
const QUICK_SUGGESTIONS: QuickSuggestion[] = [
   { label: "Criar artigo", prompt: "Crie um artigo completo sobre " },
   { label: "Analisar SEO", prompt: "Analise o SEO deste conteúdo e sugira melhorias: " },
   { label: "Pesquisar", prompt: "Pesquise sobre " },
   { label: "Otimizar texto", prompt: "Otimize este texto para SEO: " },
   { label: "Estratégia", prompt: "Crie uma estratégia de conteúdo para " },
];
```

Replace with:
```typescript
const QUICK_SUGGESTIONS: QuickSuggestion[] = [
   { label: "Criar artigo", prompt: "Crie um artigo completo sobre " },
   { label: "Pesquisar tópico", prompt: "Pesquise e gere um briefing completo sobre " },
   { label: "Analisar concorrentes", prompt: "Analise os concorrentes que ranqueiam para " },
   { label: "Keywords", prompt: "Crie uma estratégia de keywords para o tópico: " },
   { label: "Revisar", prompt: "Faça uma revisão completa de qualidade deste conteúdo" },
];
```

**Step 2: Typecheck + commit**

```bash
bun run typecheck 2>&1 | head -10
git add apps/web/src/features/context-panel/ui/teco-chat-tab.tsx
git commit -m "feat(ui): update chat quick suggestions — research, competitor, keyword, review prompts"
```

---

## Phase 6 — Final Verification

### Task 15: Full Typecheck + Smoke Test

**Step 1: Typecheck the entire project**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck
```

Expected: 0 errors

**Step 2: Biome lint check**

```bash
bun run check
```

Expected: no new lint issues

**Step 3: Start dev server**

```bash
bun dev
```

**Step 4: Manual checklist**

- [ ] Editor toolbar shows 3 workflow pills: SEO, GEO, Revisar
- [ ] Clicking "SEO" shows loading ring → toast with `WorkflowResultCard` (score delta)
- [ ] Clicking "GEO" shows loading ring → toast with GEO changes count
- [ ] Clicking "Revisar" shows loading ring → toast with approval status + score
- [ ] Chat quick suggestions updated (Pesquisar tópico, Analisar concorrentes, Keywords, Revisar)
- [ ] In the chat, triggering a content creation request shows `AgentCallTool` cards for each agent
- [ ] Research tools show amber-tinted compact cards with query preview
- [ ] Editor tools show blue-tinted compact cards with text preview
- [ ] ToolFallback shows friendly label instead of raw key name

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: workflow-first agent architecture — 6 workflows, beautiful tool UI, premium editor toolbar"
```

---

## What Was Built

### Backend
| File | What it does |
|------|-------------|
| `tool-registry.ts` | Central capability-tagged tool groups |
| `workflows/utils.ts` | Shared parsers (review signal, SEO score, audit issues) |
| `workflows/seo-audit-workflow.ts` | Analyze → apply fixes, typed score delta |
| `workflows/geo-optimize-workflow.ts` | GEO audit → definition blocks, FAQ, citations |
| `workflows/research-workflow.ts` | SERP + competitors + gaps + frontmatter |
| `workflows/content-review-workflow.ts` | Review + SEO parallel, revise loop max 2x |
| `workflows/competitor-analysis-workflow.ts` | SERP landscape + gap report |
| `workflows/keyword-strategy-workflow.ts` | Clusters + 5 title suggestions |

### API
| Change | What it does |
|--------|-------------|
| `CustomRequestContext` | Extended with `route`, `teamId`, `brandId` |
| `WORKFLOW_IDS` + `WorkflowId` | Whitelist exported for API validation |
| `executeWorkflow` procedure | Runs any workflow by ID, returns typed result |

### UI (Tool Cards — from agentic-ui-tool-components.md)
| Component | Inspiration |
|-----------|-------------|
| `AgentCallTool` | Claude AI — large card + shimmer when running |
| `EditorTool` | Compact pill + text preview |
| `ResearchTool` | Amber pill + query preview |
| `ToolFallback` | Friendly labels via `TOOL_DISPLAY_LABELS` |

### UI (Workflow — new)
| Component | Inspiration |
|-----------|-------------|
| `WorkflowResultCard` | Claude AI — expandable card, colored left border per workflow |
| `WorkflowTriggerPanel` | Perplexity — pill buttons, loading ring, gradient hover states |
