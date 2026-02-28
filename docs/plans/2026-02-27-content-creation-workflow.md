# Content Creation Workflow — Agent Team

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the LLM-driven content-agent routing with a Mastra Workflow that orchestrates a specialist agent team (research → write → parallel review+SEO → revise loop) to produce high-quality content.

**Architecture:** A `contentCreationWorkflow` is registered in Mastra and triggered from the chat route when `workflow: "content-creation"` is in the request body. Each step calls a lean specialist agent. The writer only writes. The reviewer returns a structured approval signal. The workflow loops (max 3 passes) until the reviewer approves. Content flows to the editor in real-time via `onBodyUpdate` → DB → Electric SQL.

**Tech Stack:** `@mastra/core` (createStep, createWorkflow), `@mastra/ai-sdk` (handleWorkflowStream), existing agents (researchAgent, writerAgent, reviewerAgent, seoAuditorAgent), TanStack Router API routes, Drizzle ORM repositories.

---

## Task 1: Strip writer-agent to pure write/edit

**Files:**
- Modify: `packages/agents/src/mastra/agents/writer-agent.ts`

**What to remove from writer-agent tools:**
- `searchPreviousContent` (research-agent already has it)
- `graphSearch` (research-agent already has it)
- `webSearch` (research-agent owns research)
- `serpAnalysis` (research-agent owns research)
- `factFinder` (research-agent owns research)
- `injectKeywords` (seo-auditor-agent owns this)
- `addInternalLinks` (seo-auditor-agent owns this)
- `addExternalLinks` (seo-auditor-agent owns this)
- `improveReadability` (seo-auditor-agent owns this)
- `generateQuickAnswer` (seo-auditor-agent owns this)

**Step 1: Remove the 10 imports from writer-agent.ts**

Remove these import lines (lines 10–16, 21–22 approx):
```typescript
// DELETE these imports:
import { addExternalLinksTool } from "../tools/editor/add-external-links-tool";
import { addInternalLinksTool } from "../tools/editor/add-internal-links-tool";
import { generateQuickAnswerTool } from "../tools/editor/generate-quick-answer-tool";
import { improveReadabilityTool } from "../tools/editor/improve-readability-tool";
import { injectKeywordsTool } from "../tools/editor/inject-keywords-tool";
import { graphSearchTool } from "../tools/rag/graph-search-tool";
import { searchPreviousContentTool } from "../tools/rag/search-previous-content-tool";
import { factFinderTool } from "../tools/research/fact-finder-tool";
import { serpAnalysisTool } from "../tools/research/serp-analysis-tool";
import { webSearchTool } from "../tools/research/web-search-tool";
```

**Step 2: Remove the 10 tools from the tools object**

In the `tools: { ... }` block, delete:
```typescript
// DELETE these tool registrations:
searchPreviousContent: searchPreviousContentTool,
graphSearch: graphSearchTool,
webSearch: webSearchTool,
serpAnalysis: serpAnalysisTool,
factFinder: factFinderTool,
injectKeywords: injectKeywordsTool,
addInternalLinks: addInternalLinksTool,
addExternalLinks: addExternalLinksTool,
improveReadability: improveReadabilityTool,
generateQuickAnswer: generateQuickAnswerTool,
```

**Step 3: Simplify writer instructions**

Replace the `## TOOL USAGE ORDER` section in `getInstructions()` with:

```
## TOOL USAGE ORDER

1. getInstructionMemories — load writer preferences
2. **SET FRONTMATTER FIRST**: editTitle → editDescription → editSlug → editKeywords
3. **WRITE BODY**: insertText(position="end") with the full article
   - Start from H2 (NO H1 in body)
   - Apply diretrizes-de-escrita: hook in 100 words, H2 every 200–300 words, max 3–4 sentences/paragraph
   - Apply escrita-humana: no AI phrases, no travessões, no filler
4. Precise edits when revising: replaceText, deleteText, insertText at specific position
```

Also remove references to `searchPreviousContent`, `graphSearch`, `webSearch`, `serpAnalysis`, `factFinder`, `addInternalLinks`, `addExternalLinks`, `injectKeywords`, `improveReadability`, `generateQuickAnswer` from the `## MANDATORY TOOL CHECKLIST` and `## SKILLS` sections of the instructions.

**Step 4: Verify typecheck passes**

```bash
bun run typecheck
```
Expected: no errors in `writer-agent.ts`

**Step 5: Commit**

```bash
git add packages/agents/src/mastra/agents/writer-agent.ts
git commit -m "refactor(agents): strip writer-agent to pure write/edit tools"
```

---

## Task 2: Add structured approval signal to reviewer-agent

**Files:**
- Modify: `packages/agents/src/mastra/agents/reviewer-agent.ts`

The workflow needs to parse the reviewer's output to decide whether to loop. The reviewer must end every response with a machine-readable signal.

**Step 1: Add approval signal section to reviewer instructions**

At the end of `getInstructions()`, before `Respond in the same language...`, add:

```
## APPROVAL SIGNAL

After your review report, ALWAYS end your response with exactly this line (no markdown fences, no extra text):

REVIEW_SIGNAL: {"approved":true,"issues":[]}

Rules:
- `approved: true` ONLY if there are zero High Priority issues
- `approved: false` if ANY High Priority issues exist
- `issues`: array of strings describing each High Priority issue (empty array if approved)

Example (not approved):
REVIEW_SIGNAL: {"approved":false,"issues":["Uncited statistics in section 2","AI-sounding phrases in intro"]}

Example (approved):
REVIEW_SIGNAL: {"approved":true,"issues":[]}
```

**Step 2: Verify typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/agents/reviewer-agent.ts
git commit -m "feat(agents): add structured REVIEW_SIGNAL to reviewer-agent output"
```

---

## Task 3: Create the content-creation workflow

**Files:**
- Create: `packages/agents/src/mastra/workflows/content-creation-workflow.ts`

**Step 1: Create the workflows directory**

```bash
mkdir -p packages/agents/src/mastra/workflows
```

**Step 2: Create the workflow file**

```typescript
// packages/agents/src/mastra/workflows/content-creation-workflow.ts
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { researchAgent } from "../agents/research-agent";
import { reviewerAgent } from "../agents/reviewer-agent";
import { seoAuditorAgent } from "../agents/seo-auditor-agent";
import { writerAgent } from "../agents/writer-agent";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseReviewSignal(text: string): {
   approved: boolean;
   issues: string[];
} {
   const match = text.match(/REVIEW_SIGNAL:\s*(\{[^}]+\})/s);
   if (!match) return { approved: false, issues: ["Could not parse review signal"] };
   try {
      return JSON.parse(match[1]);
   } catch {
      return { approved: false, issues: ["Invalid review signal JSON"] };
   }
}

// ─── Step 1: Research ────────────────────────────────────────────────────────

const researchStep = createStep({
   id: "research",
   inputSchema: z.object({
      topic: z.string().describe("The topic or title to research"),
   }),
   outputSchema: z.object({
      briefing: z.string().describe("Research briefing for the writer"),
   }),
   execute: async ({ inputData, requestContext }) => {
      const result = await researchAgent.generate(
         `Research this topic thoroughly and produce a structured briefing: ${inputData.topic}`,
         { requestContext },
      );
      return { briefing: result.text };
   },
});

// ─── Step 2: Write ───────────────────────────────────────────────────────────

const writeStep = createStep({
   id: "write",
   inputSchema: z.object({
      briefing: z.string(),
   }),
   outputSchema: z.object({
      message: z.string(),
   }),
   execute: async ({ inputData, requestContext }) => {
      const result = await writerAgent.generate(
         `Using this research briefing, write a complete, publication-ready article:\n\n${inputData.briefing}`,
         { requestContext },
      );
      return { message: result.text };
   },
});

// ─── Step 3: Revision cycle (runs in dowhile loop) ───────────────────────────
// Reviewer and SEO auditor run in parallel, writer revises if not approved.

const revisionCycleStep = createStep({
   id: "revision-cycle",
   // Accepts any input — first call gets writeStep output, subsequent calls get
   // this step's own output. The step reads editor state via agent tools, not input.
   inputSchema: z.object({}).passthrough(),
   outputSchema: z.object({
      approved: z.boolean(),
      issues: z.array(z.string()),
      feedback: z.string(),
   }),
   execute: async ({ inputData, requestContext }) => {
      // Reviewer and SEO auditor analyze the current editor state in parallel
      const [reviewResult, seoResult] = await Promise.all([
         reviewerAgent.generate(
            "Review the current article content for quality, tone, citations, readability, and AI patterns.",
            { requestContext },
         ),
         seoAuditorAgent.generate(
            "Audit the current article content for SEO. Apply all improvements directly.",
            { requestContext },
         ),
      ]);

      const { approved, issues } = parseReviewSignal(reviewResult.text);
      const combinedFeedback = `${reviewResult.text}\n\n---\nSEO Audit:\n${seoResult.text}`;

      if (!approved) {
         await writerAgent.generate(
            `Revise the current article based on this feedback:\n\n${combinedFeedback}`,
            { requestContext },
         );
      }

      return {
         approved,
         issues,
         feedback: combinedFeedback,
      };
   },
});

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const contentCreationWorkflow = createWorkflow({
   id: "content-creation",
   inputSchema: z.object({
      topic: z.string(),
   }),
   outputSchema: z.object({
      approved: z.boolean(),
      issues: z.array(z.string()),
      feedback: z.string(),
   }),
})
   .then(researchStep)
   .then(writeStep)
   .dowhile(
      revisionCycleStep,
      async ({ inputData, iterationCount }) =>
         !inputData.approved && iterationCount < 3,
   )
   .commit();
```

**Step 3: Verify typecheck**

```bash
bun run typecheck
```

Expected: no type errors. If `requestContext` has type issues in step execute, check the Mastra core types for the correct `execute` signature — it's `({ inputData, requestContext, ... })`.

**Step 4: Commit**

```bash
git add packages/agents/src/mastra/workflows/
git commit -m "feat(agents): add content-creation workflow with research→write→review loop"
```

---

## Task 4: Register workflow in Mastra + export it

**Files:**
- Modify: `packages/agents/src/mastra/index.ts`

**Step 1: Import and register the workflow**

Add import after the agent imports:
```typescript
import { contentCreationWorkflow } from "./workflows/content-creation-workflow";
```

Add `workflows` to the `Mastra` constructor:
```typescript
export const mastra: Mastra = new Mastra({
   agents: {
      platformRouterAgent,
      contentAgent,
      researchAgent,
      writerAgent,
      seoAuditorAgent,
      reviewerAgent,
      fimAgent,
      inlineEditAgent,
   },
   workflows: {
      contentCreationWorkflow,   // ← add this
   },
   vectors: { pgVector: pgVectorStore },
   storage: mastraStorage,
   workspace,
   observability,
});
```

Also export the workflow and `handleWorkflowStream` for use in the route:
```typescript
export { contentCreationWorkflow };
export { handleWorkflowStream } from "@mastra/ai-sdk";
```

**Step 2: Verify typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/index.ts
git commit -m "feat(agents): register content-creation workflow in Mastra instance"
```

---

## Task 5: Fix context enrichment in chat route

**Files:**
- Modify: `apps/web/src/routes/api/chat/$.ts`

**Problem:** When `contextId` (contentId) is present, the route only passes `userId` and `contentId` to `createRequestContext`. The `writerId`, `language`, and `writerInstructions` are never set — causing all RAG tools to fail with "Missing writerId".

**Fix:** When `contextId` is present, load the content record and writer instructions from DB before building the request context.

**Step 1: Add imports to the chat route**

```typescript
import { getContentById } from "@packages/database/repositories/content-repository";
import { getWriterInstructions } from "@packages/database/repositories/writer-instructions-repository";
```

**Step 2: Replace the `createRequestContext` call**

Replace:
```typescript
requestContext: createRequestContext({
   userId,
   ...(contextId ? { contentId: contextId, onBodyUpdate, onMetaUpdate } : {}),
}),
```

With:
```typescript
requestContext: createRequestContext({
   userId,
   ...(contextId
      ? await (async () => {
           const contentRecord = await getContentById(db, contextId);
           const writerId = contentRecord?.writerId ?? undefined;
           const writerInstructions = writerId
              ? await getWriterInstructions(db, writerId)
              : undefined;
           return {
              contentId: contextId,
              writerId,
              writerInstructions,
              onBodyUpdate,
              onMetaUpdate,
           };
        })()
      : {}),
}),
```

This is an IIFE to keep it inline. If you prefer clarity, extract it to a helper function `loadContentContext(db, contextId)` in the same file that returns the partial context object.

**Step 3: Verify typecheck**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add apps/web/src/routes/api/chat/$.ts
git commit -m "fix(chat): enrich request context with writerId and writerInstructions from DB"
```

---

## Task 6: Add workflow execution path to chat route

**Files:**
- Modify: `apps/web/src/routes/api/chat/$.ts`

When the request body contains `workflow: "content-creation"`, use `handleWorkflowStream` instead of `handleChatStream`. This is the path the editor panel will use for full article generation.

**Step 1: Add import**

```typescript
import {
   createRequestContext,
   handleChatStream,
   handleWorkflowStream,  // ← add
   mastra,
} from "@packages/agents";
```

**Step 2: Add `workflow` to body parsing**

```typescript
const { messages, threadId, router = "auto", contextId, workflow } = body;
```

**Step 3: Add workflow branch before the existing `handleChatStream` call**

```typescript
// ── Workflow path ──────────────────────────────────────────────────────────
if (workflow === "content-creation" && contextId) {
   // Extract the topic from the last user message
   const lastUserMessage = [...messages].reverse().find(
      (m: ModelMessage) => m.role === "user",
   );
   const topic =
      typeof lastUserMessage?.content === "string"
         ? lastUserMessage.content
         : "Untitled article";

   const workflowStream = await handleWorkflowStream({
      mastra,
      workflowId: "content-creation",
      params: {
         inputData: { topic },
         requestContext: createRequestContext({
            userId,
            contentId: contextId,
            ...(await (async () => {
               const contentRecord = await getContentById(db, contextId);
               const writerId = contentRecord?.writerId ?? undefined;
               const writerInstructions = writerId
                  ? await getWriterInstructions(db, writerId)
                  : undefined;
               return { writerId, writerInstructions, onBodyUpdate, onMetaUpdate };
            })()),
         }),
      },
   });

   // Filter data-* parts same as agent stream
   const filteredWorkflowStream = workflowStream.pipeThrough(
      new TransformStream({
         transform(chunk, controller) {
            const type = (chunk as { type?: string }).type;
            if (typeof type === "string" && type.startsWith("data-")) return;
            controller.enqueue(chunk);
         },
      }),
   );

   return createUIMessageStreamResponse({ stream: filteredWorkflowStream });
}
// ── End workflow path ───────────────────────────────────────────────────────

// Existing agent path continues below...
const stream = await handleChatStream({ ... });
```

> **Note:** The DB enrichment logic in Task 5 and Task 6 is duplicated. If you prefer, extract it to a helper at the top of the POST handler:
> ```typescript
> const contentCtx = contextId ? await loadContentContext(db, contextId) : {};
> ```
> Then use `contentCtx` in both the agent and workflow paths.

**Step 4: Verify typecheck**

```bash
bun run typecheck
```

**Step 5: Commit**

```bash
git add apps/web/src/routes/api/chat/$.ts
git commit -m "feat(chat): add workflow execution path for content-creation"
```

---

## Task 7: Trigger workflow from UI (chat context store + transport)

**Files:**
- Modify: `apps/web/src/features/teco-chat/stores/chat-context-store.ts`
- Modify: `apps/web/src/features/teco-chat/hooks/use-teco-runtime.ts`

The editor panel needs to send `workflow: "content-creation"` in the body when a user asks to write/generate a full article. The simplest approach: add a `workflow` field to the chat context store that the transport includes in the body.

**Step 1: Add `workflow` field to chat context store**

```typescript
// chat-context-store.ts
interface ChatContextState {
   router: "auto" | "content";
   contextId: string | null;
   workflow: "content-creation" | null;   // ← add
}

const DEFAULT_STATE: ChatContextState = {
   router: "auto",
   contextId: null,
   workflow: null,   // ← add
};

export function setChatContext(
   router: ChatContextState["router"],
   contextId: string | null,
   workflow?: ChatContextState["workflow"],   // ← add
) {
   chatContextStore.setState(() => ({ router, contextId, workflow: workflow ?? null }));
}
```

**Step 2: Include `workflow` in the transport body**

In `use-teco-runtime.ts`, update the transport body:

```typescript
body: async () => {
   const threadId = await ensureThread();
   const { contextId, router, workflow } = chatContextStore.state;
   return {
      teamId,
      threadId,
      ...(contextId ? { contextId, router } : {}),
      ...(workflow ? { workflow } : {}),   // ← add
   };
},
```

**Step 3: Wire the "Generate article" action**

In the editor context panel (e.g., `apps/web/src/features/editor/ui/editor-fixed-toolbar.tsx` or the editor's chat tab), when the user clicks a "Generate" button or similar action, call:

```typescript
setChatContext("content", contentId, "content-creation");
```

This tells the transport to include `workflow: "content-creation"` in the next request.

> **Note:** After the workflow completes, reset the workflow field so subsequent messages use the normal agent path:
> ```typescript
> setChatContext("content", contentId, null);
> ```
> This reset should happen on transport success or from the toolbar component.

**Step 4: Verify typecheck**

```bash
bun run typecheck
```

**Step 5: Commit**

```bash
git add apps/web/src/features/teco-chat/stores/chat-context-store.ts
git add apps/web/src/features/teco-chat/hooks/use-teco-runtime.ts
git commit -m "feat(ui): add workflow field to chat context store and transport"
```

---

## Testing Checklist

After all tasks are complete, verify end-to-end:

1. Open the editor with a content item that has a writer assigned
2. Trigger the workflow (set `workflow: "content-creation"` via the store)
3. Send a message like "Escreva um artigo completo sobre licitações públicas"
4. Expected sequence visible in logs:
   - `[workflow:content-creation] step:research started`
   - `[workflow:content-creation] step:write started` → content appears in editor
   - `[workflow:content-creation] step:revision-cycle started` (up to 3x)
   - Workflow completes
5. Editor shows the written article via Electric SQL
6. Non-workflow chat (no `workflow` in body) still works via platformRouterAgent

**Verify the writerId fix:**
- Check that RAG tools (searchPreviousContent, graphSearch) no longer throw "Missing writerId"
- Look for writerId in server logs when contentId is present

---

## Future: Path to Option C (model-driven loop)

When ready to move from rule-based to model-driven loop termination:

1. Remove the `iterationCount < 3` hard cap from `.dowhile()` condition — let `approved` be the only signal
2. Give the reviewer more nuanced approval logic in its instructions (e.g., "approve if improvements from last pass are < 5%")
3. Add a confidence score to `REVIEW_SIGNAL`: `{"approved": false, "confidence": 0.7, "issues": [...]}`
4. The workflow condition can then threshold on confidence: `confidence < 0.9 && iterationCount < 5`

The structured `REVIEW_SIGNAL` format established in Task 2 is already the right foundation for this.
