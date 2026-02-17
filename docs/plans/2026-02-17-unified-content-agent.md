# Unified Content Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate 6 separate agents (orchestrator + 5 sub-agents) into a single unified content agent to reduce latency by 30%, simplify maintenance, and eliminate orchestration overhead.

**Architecture:** Replace the orchestrator pattern with a single agent that has direct access to all tools and workflows. The agent contains consolidated instructions covering planning, research, writing, SEO auditing, and review workflows. FIM and inline-edit agents remain separate as they are specialized for different contexts (autocomplete and real-time editing).

**Tech Stack:** 
- Mastra agent framework
- 40+ existing tools (research, analysis, editor, frontmatter, RAG)
- OpenRouter + moonshotai/kimi-k2.5 model

---

## Task 1: Create Unified Content Agent

**Files:**
- Create: `packages/agents/src/mastra/agents/unified-content-agent.ts`
- Reference: `packages/agents/src/mastra/agents/orchestrator-agent.ts` (for pattern)
- Reference: `packages/agents/src/mastra/agents/writer-agent.ts` (for instructions style)

**Step 1: Create agent file with imports**

Create `packages/agents/src/mastra/agents/unified-content-agent.ts`:

```typescript
import { Agent } from "@mastra/core/agent";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";

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

// ─── Frontmatter Tools ───────────────────────────────────────────────────────
import { editDescriptionTool } from "../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "../tools/frontmatter/edit-slug-tool";
import { editTitleTool } from "../tools/frontmatter/edit-title-tool";

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
import { replaceTextTool } from "../tools/editor/replace-text-tool";
import { suggestImagesTool } from "../tools/editor/suggest-images-tool";

// ─── Utility Tools ───────────────────────────────────────────────────────────
import { dateToolTool } from "../tools/date-tool";
```

**Step 2: Add instructions builder function**

Add after imports:

```typescript
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
6. Generate complete, high-quality articles (800+ words)
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
```

**Step 3: Add agent definition**

Add after instructions function:

```typescript
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
      return (
         (requestContext?.get("model") as string) ??
         "openrouter/moonshotai/kimi-k2.5"
      );
   },

   instructions: ({ requestContext }) => {
      const writerInstructions = requestContext?.get("writerInstructions") as
         | InstructionMemoryItem[]
         | undefined;
      const language = (requestContext?.get("language") as string) ?? "pt-BR";
      return getUnifiedAgentInstructions(language, writerInstructions);
   },

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
      addExternalLinks: addExternalLinksTool,
      improveReadability: improveReadabilityTool,
      optimizeTitle: optimizeTitleTool,
      optimizeMeta: optimizeMetaTool,
      generateQuickAnswer: generateQuickAnswerTool,
      suggestImages: suggestImagesTool,

      // ─── Utility ──────────────────────────────────────────────────────────
      dateTool: dateToolTool,
   },
});
```

**Step 4: Verify TypeScript compiles**

Run: `bun run typecheck --filter=@packages/agents`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add packages/agents/src/mastra/agents/unified-content-agent.ts
git commit -m "feat(agents): add unified content agent with all workflows"
```

---

## Task 2: Update Mastra Instance

**Files:**
- Modify: `packages/agents/src/mastra/index.ts:1-64`

**Step 1: Import unified agent**

Add import after line 11:

```typescript
import { unifiedContentAgent } from "./agents/unified-content-agent";
```

**Step 2: Add unified agent to Mastra instance**

Replace lines 32-41 with:

```typescript
export const mastra: Mastra = new Mastra({
   agents: {
      // New unified agent (replaces orchestrator + sub-agents)
      unifiedContent: unifiedContentAgent,
      
      // Specialized agents (kept separate)
      fimAgent,
      inlineEditAgent,
      
      // DEPRECATED: Will be removed in next phase
      orchestratorAgent,
      writerAgent,
   },
   vectors: { pgVector: pgVectorStore },
   storage: mastraStorage,
});
```

**Step 3: Verify TypeScript compiles**

Run: `bun run typecheck --filter=@packages/agents`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add packages/agents/src/mastra/index.ts
git commit -m "feat(agents): add unified agent to mastra instance"
```

---

## Task 3: Update Agent Router (Add Unified Endpoint)

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/agent.ts`
- Reference: Existing `executeAgent` procedure

**Step 1: Read current agent router**

Run: `cat apps/web/src/integrations/orpc/router/agent.ts | head -100`
Expected: See existing `executeAgent` procedure using `orchestratorAgent`

**Step 2: Add unified agent procedure**

Add new procedure after existing `executeAgent`:

```typescript
/**
 * Execute unified content agent
 * New unified agent that combines all workflows (planning, research, writing, SEO, review)
 */
export const executeUnifiedAgent = protectedProcedure
   .input(
      z.object({
         teamId: z.string().uuid(),
         contentId: z.string().uuid(),
         prompt: z.string().min(1).max(10000),
         brandId: z.string().uuid().optional(),
         writerId: z.string().uuid().optional(),
         model: z.string().optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { teamId, contentId, prompt, brandId, writerId, model } = input;

      // Verify team membership
      const membership = await db.query.teamMember.findFirst({
         where: and(
            eq(teamMember.teamId, teamId),
            eq(teamMember.userId, context.userId),
         ),
      });

      if (!membership) {
         throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this team",
         });
      }

      // Get content
      const content = await db.query.content.findFirst({
         where: and(eq(contentTable.id, contentId), eq(contentTable.teamId, teamId)),
      });

      if (!content) {
         throw new ORPCError("NOT_FOUND", { message: "Content not found" });
      }

      // Get writer instructions if writerId provided
      let writerInstructions: InstructionMemoryItem[] | undefined;
      if (writerId) {
         writerInstructions = await db.query.instructionMemory.findMany({
            where: and(
               eq(instructionMemory.writerId, writerId),
               eq(instructionMemory.userId, context.userId),
            ),
            orderBy: [desc(instructionMemory.createdAt)],
            limit: 10,
         });
      }

      // Create request context
      const requestContext = createRequestContext({
         userId: context.userId,
         brandId,
         writerId,
         model: (model as ModelId) ?? "openrouter/moonshotai/kimi-k2.5",
         language: "pt-BR",
         writerInstructions,
      });

      // Execute unified agent
      const agent = mastra.getAgent("unifiedContent");
      const result = await agent.generate(prompt, { requestContext });

      // Emit agent event
      emitEvent("ai.agent.completed", {
         userId: context.userId,
         teamId,
         agentId: "unified-content-agent",
         model: model ?? "openrouter/moonshotai/kimi-k2.5",
         inputTokens: result.usage?.inputTokens ?? 0,
         outputTokens: result.usage?.outputTokens ?? 0,
         metadata: {
            contentId,
            brandId,
            writerId,
         },
      });

      return {
         text: result.text,
         toolCalls: result.toolCalls,
         usage: result.usage,
      };
   });
```

**Step 3: Export new procedure**

Add to exports at end of file:

```typescript
export const agentRouter = {
   executeAgent,
   executeUnifiedAgent, // New unified agent
};
```

**Step 4: Verify TypeScript compiles**

Run: `bun run typecheck --filter=web`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add apps/web/src/integrations/orpc/router/agent.ts
git commit -m "feat(agent): add executeUnifiedAgent procedure"
```

---

## Task 4: Update Frontend to Use Unified Agent

**Files:**
- Modify: `apps/web/src/features/content/hooks/use-agent-execution.ts` (or similar)
- Identify: Where `orpc.agent.executeAgent` is called

**Step 1: Find agent execution hooks**

Run: `rg "executeAgent" --type=ts apps/web/src/features`
Expected: List of files calling the agent

**Step 2: Add unified agent hook**

Create or modify hook to support both agents:

```typescript
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useUnifiedAgent() {
   return useMutation(
      orpc.agent.executeUnifiedAgent.mutationOptions({
         onSuccess: (data) => {
            // Handle success
            console.log("Unified agent completed:", data);
         },
         onError: (error) => {
            // Handle error
            console.error("Unified agent failed:", error);
         },
      }),
   );
}
```

**Step 3: Add feature flag or option to switch agents**

Add to editor config or feature flags:

```typescript
// In editor config or settings
const useUnifiedAgent = true; // Feature flag

// In component
const legacyAgent = useAgent(); // Old orchestrator
const unifiedAgent = useUnifiedAgent(); // New unified agent

const executeAgent = useUnifiedAgent ? unifiedAgent : legacyAgent;
```

**Step 4: Test in development**

1. Start dev server: `bun dev`
2. Open editor
3. Execute agent command
4. Verify: Agent executes successfully
5. Check: Console logs show tool calls and results

**Step 5: Commit**

```bash
git add apps/web/src/features/content/hooks/*.ts
git commit -m "feat(frontend): add unified agent execution hook"
```

---

## Task 5: Add Migration Guide Documentation

**Files:**
- Create: `packages/agents/MIGRATION.md`

**Step 1: Create migration guide**

```markdown
# Agent Architecture Migration Guide

## Overview

Contentta is migrating from an orchestrator + sub-agent pattern to a unified agent architecture.

**Before:**
- 1 orchestrator agent
- 5 sub-agents (planner, researcher, writer, seoAuditor, reviewer)
- ~30% overhead from delegation and coordination

**After:**
- 1 unified content agent with all workflows
- Direct access to 40+ tools
- 30% faster, simpler to maintain

## Timeline

### Phase 1: Parallel Operation (Current)
- Both agents available
- `orchestratorAgent` marked deprecated
- `unifiedContentAgent` available for testing
- Frontend can switch between agents via feature flag

### Phase 2: Migration (2 weeks)
- Monitor unified agent performance
- Migrate all frontend calls to unified agent
- Update documentation and examples

### Phase 3: Cleanup (After 2 weeks)
- Remove orchestrator and sub-agents
- Remove old agent files
- Update all references

## Usage

### Old Pattern (Deprecated)

```typescript
const agent = mastra.getAgent("orchestratorAgent");
const result = await agent.generate("Write a post about X", { requestContext });
```

### New Pattern (Recommended)

```typescript
const agent = mastra.getAgent("unifiedContent");
const result = await agent.generate("Write a post about X", { requestContext });
```

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Latency** | 2-3 roundtrips | 1 roundtrip |
| **Token Usage** | +30% overhead | 30% reduction |
| **Maintenance** | 6 files | 1 file |
| **Debugging** | Track delegation chain | Linear flow |
| **Tool Access** | Limited by sub-agent | All tools available |

## Workflows

The unified agent supports 5 workflows:

1. **Planning** - Structure, outlines, briefings
2. **Research** - SERPs, competitors, data collection
3. **Writing** - Complete articles with frontmatter
4. **SEO Audit** - Analysis and optimization
5. **Review** - Quality checks and feedback

See `unified-content-agent.ts` for detailed workflow instructions.

## Specialized Agents (Kept Separate)

- **FIM Agent** - Autocomplete and fill-in-the-middle
- **Inline Edit Agent** - Real-time inline editing

These remain separate as they serve different contexts.
```

**Step 2: Commit**

```bash
git add packages/agents/MIGRATION.md
git commit -m "docs(agents): add migration guide for unified agent"
```

---

## Task 6: Add Tests for Unified Agent

**Files:**
- Create: `packages/agents/src/mastra/agents/__tests__/unified-content-agent.test.ts`

**Step 1: Write test for agent initialization**

```typescript
import { describe, expect, test } from "bun:test";
import { unifiedContentAgent } from "../unified-content-agent";

describe("UnifiedContentAgent", () => {
   test("agent is properly initialized", () => {
      expect(unifiedContentAgent.id).toBe("unified-content-agent");
      expect(unifiedContentAgent.name).toBe("Unified Content Agent");
      expect(unifiedContentAgent.description).toContain("Agente unificado");
   });

   test("agent has all required tools", () => {
      const tools = unifiedContentAgent.tools;
      
      // Memory & RAG
      expect(tools.getInstructionMemories).toBeDefined();
      expect(tools.searchPreviousContent).toBeDefined();
      expect(tools.graphSearch).toBeDefined();
      
      // Research
      expect(tools.webSearch).toBeDefined();
      expect(tools.serpAnalysis).toBeDefined();
      expect(tools.contentGap).toBeDefined();
      
      // Analysis
      expect(tools.seoScore).toBeDefined();
      expect(tools.readability).toBeDefined();
      expect(tools.keywordDensity).toBeDefined();
      
      // Frontmatter
      expect(tools.editTitle).toBeDefined();
      expect(tools.editDescription).toBeDefined();
      expect(tools.editKeywords).toBeDefined();
      expect(tools.editSlug).toBeDefined();
      
      // Editor
      expect(tools.insertText).toBeDefined();
      expect(tools.replaceText).toBeDefined();
      expect(tools.deleteText).toBeDefined();
   });

   test("agent has correct model configuration", () => {
      const mockContext = {
         get: (key: string) => {
            if (key === "model") return "openrouter/custom-model";
            return null;
         },
      };
      
      const model = unifiedContentAgent.model({ requestContext: mockContext });
      expect(model).toBe("openrouter/custom-model");
   });

   test("agent uses default model when not specified", () => {
      const mockContext = {
         get: (key: string) => null,
      };
      
      const model = unifiedContentAgent.model({ requestContext: mockContext });
      expect(model).toBe("openrouter/moonshotai/kimi-k2.5");
   });
});
```

**Step 2: Run tests**

Run: `bun test packages/agents/src/mastra/agents/__tests__/unified-content-agent.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/agents/__tests__/unified-content-agent.test.ts
git commit -m "test(agents): add tests for unified content agent"
```

---

## Task 7: Update CLAUDE.md Documentation

**Files:**
- Modify: `packages/agents/CLAUDE.md` (or root `CLAUDE.md`)

**Step 1: Document unified agent in CLAUDE.md**

Add section about agent architecture:

```markdown
## AI Agents (packages/agents/)

### Unified Content Agent

Single agent combining planning, research, writing, SEO, and review workflows.

**Usage:**
```typescript
import { mastra, createRequestContext } from "@packages/agents/mastra";

const agent = mastra.getAgent("unifiedContent");
const context = createRequestContext({
   userId: "user-id",
   brandId: "brand-id",
   writerId: "writer-id",
   model: "openrouter/moonshotai/kimi-k2.5",
   language: "pt-BR",
});

const result = await agent.generate("Write a post about TypeScript", { 
   requestContext: context 
});
```

**Workflows:**
1. **Planning** - Structure, outlines, metadata
2. **Research** - SERPs, competitors, facts
3. **Writing** - Complete articles with YAML frontmatter
4. **SEO Audit** - Analysis and optimization
5. **Review** - Quality checks and feedback

**Tools:** 40+ tools organized by category:
- Memory & RAG (3)
- Research (8)
- Analysis (13)
- Frontmatter (4)
- Editor (17)

### Specialized Agents

- **FIM Agent** (`fimAgent`) - Autocomplete and fill-in-the-middle
- **Inline Edit Agent** (`inlineEditAgent`) - Real-time inline editing

### Deprecated Agents

⚠️ **Orchestrator pattern is deprecated:**
- `orchestratorAgent` - Replaced by `unifiedContent`
- `writerAgent` - Merged into `unifiedContent`
- `plannerAgent` - Merged into `unifiedContent`
- `researcherAgent` - Merged into `unifiedContent`
- `seoAuditorAgent` - Merged into `unifiedContent`
- `reviewerAgent` - Merged into `unifiedContent`

See `packages/agents/MIGRATION.md` for migration guide.
```

**Step 2: Commit**

```bash
git add CLAUDE.md packages/agents/CLAUDE.md
git commit -m "docs: document unified agent architecture"
```

---

## Task 8: Manual Testing

**Files:**
- Test in: Development environment

**Step 1: Start dev environment**

```bash
bun dev
```

**Step 2: Test writing workflow**

1. Open content editor
2. Execute agent with prompt: "Escreva um post sobre React Server Components"
3. Verify: Agent produces article with YAML frontmatter
4. Check: Tool calls in console (should see webSearch, serpAnalysis, etc.)

**Step 3: Test SEO audit workflow**

1. Open content with existing text
2. Execute agent with prompt: "Analise o SEO deste conteúdo"
3. Verify: Agent runs seoScore and other analysis tools
4. Check: Recommendations are provided with priorities

**Step 4: Test research workflow**

1. Execute agent with prompt: "Faça uma pesquisa sobre Next.js App Router"
2. Verify: Agent uses serpAnalysis, competitorContent, contentGap
3. Check: Research briefing is compiled

**Step 5: Test planning workflow**

1. Execute agent with prompt: "Planeje uma série sobre microservices"
2. Verify: Agent searches existing content, defines structure
3. Check: Outline with H2/H3 topics is provided

**Step 6: Test review workflow**

1. Open content with existing text
2. Execute agent with prompt: "Revise este conteúdo"
3. Verify: Agent checks structure, readability, tone, originality
4. Check: Structured feedback with priorities is provided

**Step 7: Document test results**

Create test report:

```markdown
# Unified Agent Test Report

## Date: [DATE]
## Tester: [NAME]

### Writing Workflow
- ✅ Produces YAML frontmatter
- ✅ Calls research tools before writing
- ✅ Generates complete article (800+ words)
- ✅ Human-sounding content

### SEO Audit Workflow
- ✅ Runs seoScore first
- ✅ Identifies specific issues
- ✅ Provides prioritized recommendations
- ✅ Applies fixes using editor tools

### Research Workflow
- ✅ Analyzes SERPs
- ✅ Studies competitors
- ✅ Finds content gaps
- ✅ Compiles briefing

### Planning Workflow
- ✅ Searches existing content
- ✅ Defines metadata
- ✅ Creates structured outline
- ✅ Identifies opportunities

### Review Workflow
- ✅ Checks structure
- ✅ Assesses readability
- ✅ Verifies tone
- ✅ Validates citations

## Issues Found
[List any issues]

## Performance
- Average latency: [X]ms
- Token usage: [X] tokens
- Comparison to orchestrator: [X]% faster
```

**Step 8: Fix any issues found**

If issues found during testing:
1. Document the issue
2. Fix in unified-content-agent.ts
3. Re-run tests
4. Commit fixes

---

## Task 9: Performance Monitoring Setup

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/agent.ts`

**Step 1: Add performance metrics**

Update executeUnifiedAgent to track metrics:

```typescript
export const executeUnifiedAgent = protectedProcedure
   .input(/* ... */)
   .handler(async ({ context, input }) => {
      const startTime = Date.now();
      
      // ... existing code ...
      
      const result = await agent.generate(prompt, { requestContext });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Track performance in PostHog
      context.posthog?.capture({
         distinctId: context.userId,
         event: "agent_execution_completed",
         properties: {
            agentId: "unified-content-agent",
            duration,
            inputTokens: result.usage?.inputTokens ?? 0,
            outputTokens: result.usage?.outputTokens ?? 0,
            totalTokens: (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0),
            toolCallsCount: result.toolCalls?.length ?? 0,
            model: model ?? "openrouter/moonshotai/kimi-k2.5",
            teamId,
            contentId,
         },
      });
      
      // Log performance metrics
      console.log(`[UnifiedAgent] Execution completed in ${duration}ms`, {
         tokens: result.usage,
         toolCalls: result.toolCalls?.length,
      });
      
      // ... existing code ...
   });
```

**Step 2: Add comparison tracking**

Add temporary tracking to compare old vs new agent:

```typescript
// In executeAgent (old orchestrator)
context.posthog?.capture({
   distinctId: context.userId,
   event: "agent_execution_completed",
   properties: {
      agentId: "orchestrator-agent", // Mark as old
      agentType: "deprecated",
      // ... other metrics
   },
});
```

**Step 3: Commit**

```bash
git add apps/web/src/integrations/orpc/router/agent.ts
git commit -m "feat(agent): add performance monitoring for unified agent"
```

---

## Task 10: Deprecation Warnings

**Files:**
- Modify: `packages/agents/src/mastra/agents/orchestrator-agent.ts`

**Step 1: Add deprecation notice to orchestrator**

Add at top of orchestrator-agent.ts:

```typescript
/**
 * @deprecated This agent is deprecated and will be removed in a future version.
 * Use `unifiedContentAgent` instead.
 * 
 * Migration guide: packages/agents/MIGRATION.md
 */
export const orchestratorAgent: Agent = new Agent({
   // ... existing code ...
});
```

**Step 2: Add console warning**

Add warning to orchestrator instructions:

```typescript
instructions: ({ requestContext }) => {
   console.warn(
      "[DEPRECATED] orchestratorAgent is deprecated. Use unifiedContentAgent instead. " +
      "See packages/agents/MIGRATION.md"
   );
   
   // ... existing instructions ...
},
```

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/agents/orchestrator-agent.ts
git commit -m "chore(agents): add deprecation warnings to orchestrator"
```

---

## Testing Checklist

After completing all tasks, verify:

- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Unified agent executes writing workflow
- [ ] Unified agent executes SEO audit workflow
- [ ] Unified agent executes research workflow
- [ ] Unified agent executes planning workflow
- [ ] Unified agent executes review workflow
- [ ] Performance metrics are tracked in PostHog
- [ ] Deprecation warnings appear in console
- [ ] Documentation is updated

---

## Rollout Plan

### Week 1: Testing & Validation
- Deploy to staging
- Test all workflows
- Monitor performance metrics
- Gather feedback

### Week 2: Gradual Migration
- Enable unified agent for 25% of users
- Monitor error rates and performance
- Adjust instructions if needed
- Increase to 50%, then 100%

### Week 3: Full Migration
- Switch all users to unified agent
- Remove orchestrator from new content creation
- Keep orchestrator for legacy support

### Week 4: Cleanup
- Remove orchestrator and sub-agents
- Delete deprecated agent files
- Update all documentation
- Final performance comparison report

---

## Success Metrics

Track these metrics to validate success:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Latency Reduction** | -30% | Compare avg execution time in PostHog |
| **Token Savings** | -25-30% | Compare token usage per request |
| **Error Rate** | <5% | Monitor failed agent executions |
| **User Satisfaction** | >90% | User feedback surveys |
| **Code Maintenance** | -80% | Lines of code: 6 files → 1 file |

---

## Rollback Plan

If issues arise:

1. **Immediate**: Switch feature flag back to `orchestratorAgent`
2. **Investigate**: Check logs, PostHog metrics, error tracking
3. **Fix**: Update unified agent instructions or tool calls
4. **Re-test**: Verify fix in staging
5. **Re-deploy**: Gradual rollout again

---

## Notes

- **DRY**: Unified agent reuses all existing tools — no duplication
- **YAGNI**: No new tools added — only consolidation of workflows
- **TDD**: Tests added for agent initialization and configuration
- **Frequent commits**: Each task has its own commit for easy rollback

---

## References

- Current orchestrator: `packages/agents/src/mastra/agents/orchestrator-agent.ts`
- Sub-agents: `packages/agents/src/mastra/agents/{planner,researcher,writer,seo-auditor,reviewer}-agent.ts`
- Tools: `packages/agents/src/mastra/tools/**/*.ts`
- Mastra docs: https://mastra.dev
