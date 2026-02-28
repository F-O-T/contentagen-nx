# Single Agent Platform Architecture

**Date:** 2026-02-27
**Status:** Design approved, ready for implementation

---

## Problem

The current agent network has three levels of LLM routing before any work happens:

```
user message
  → platform-router-agent (no tools, just routes)
    → content-agent (no tools, just routes)
      → writer-agent / research-agent / seo-auditor-agent / reviewer-agent
```

This causes:
- Latency from multiple routing hops (each hop = extra LLM call)
- Context loss at each routing layer (re-summarizes instead of relaying)
- Tool calls trapped inside sub-agents (invisible to the UI)
- No awareness of what page or route the user is on

## Solution

Inspired by PostHog's Max AI architecture:
> "One LLM, one loop, all tools visible. Context is everything — every abstraction layer that loses context hurts."

**One agent. Mode-based tool injection. Route sets the mode via the existing store.**

---

## Architecture

### One Agent: `tecoAgent`

A single Mastra agent. Tools are injected dynamically based on `mode` from `requestContext`.

```typescript
new Agent({
  id: "teco-agent",
  tools: ({ requestContext }) => getToolsForMode(requestContext?.get("mode")),
  instructions: ({ requestContext }) => buildInstructions(requestContext),
})
```

### Modes

| Mode | Route trigger | Tools injected |
|---|---|---|
| `editor` | `/$contentId` loader | write + frontmatter + SEO edits + analyzeContent + research + RAG |
| `content-list` | `/content/*` loader | research + platform CRUD (createContent) |
| `analytics` | `/dashboards/*` loader | platform CRUD (createDashboard) + research |
| `forms` | `/forms/*` loader | platform CRUD (createForm) + research |
| `platform` | `/chat` loader | all platform CRUD + research |

### Mode Flow

```
Route loader → setChatMode("editor", contentId)
                    ↓
use-teco-runtime body() → sends { mode, contextId, ... }
                    ↓
/api/chat/$.ts → requestContext.set("mode", mode)
                    ↓
tecoAgent tools: ({ requestContext }) → getToolsForMode("editor")
```

### Context Injection

The `instructions` function renders a `<context_atual>` block at the top of the system prompt:

**Editor mode:**
```
<context_atual>
Modo: Editor de Conteúdo
Content: "[title]"
Keywords: [keywords]
Status: [status] | palavras: ~[wordCount]
</context_atual>
```

**Other modes:** route name + relevant page data loaded on the server.

---

## Store Changes (`chatContextStore`)

Replace `router: "auto" | "content"` with `mode`:

```typescript
type ChatMode = "editor" | "content-list" | "analytics" | "forms" | "platform"

interface ChatContextState {
  mode: ChatMode          // replaces router
  contextId: string | null
  workflow: "content-creation" | null
  model: ContentModelId
  thinkingBudget: number
}
```

Replace `setChatContext(router, contextId)` with `setChatMode(mode, contextId?)`.

### Route Loaders (set mode)

```typescript
// $contentId.tsx
loader: ({ params }) => setChatMode("editor", params.contentId)

// content/index.tsx
loader: () => setChatMode("content-list")

// dashboards/*.tsx
loader: () => setChatMode("analytics")

// forms/*.tsx
loader: () => setChatMode("forms")

// chat.tsx
loader: () => setChatMode("platform")
```

---

## Tool Changes

### Collapse: 5 insert tools → 1 `insertElement`

```typescript
insertElement({ type: 'text' | 'heading' | 'list' | 'code' | 'table', content, position })
// replaces: insertText, insertHeading, insertList, insertCodeBlock, insertTable
```

### Collapse: 13 analysis tools → 1 `analyzeContent`

```typescript
analyzeContent({ aspects: ['seo' | 'readability' | 'tone' | 'structure' | 'citations' | 'patterns' | 'keywords' | 'links' | 'images' | 'duplicates'], contentId })
// replaces: seoScore, readability, keywordDensity, contentStructure, badPatterns,
//           titleMeta, quickAnswerAnalysis, imageSeo, linkDensity, toneAnalysis,
//           citation, originality, duplicateContent
```

### Remove (10 tools)

| Tool | Reason |
|---|---|
| `optimizeTitle` | Agent calls `analyzeContent` + `editTitle` directly |
| `optimizeMeta` | Agent calls `analyzeContent` + `editDescription` directly |
| `improveReadability` | Agent calls `analyzeContent` + `replaceText` directly |
| `competitorContent` | Agent orchestrates with `webSearch` + `webCrawl` |
| `contentGap` | Agent reasoning + `webSearch` |
| `factFinder` | Agent uses `webSearch` with specific queries |
| `researchCompleteness` | Instructions, not a tool |
| `graphSearch` | Overlaps with `searchPreviousContent` |
| `getInstructionMemories` | Injected into system prompt via `requestContext` |
| `dateTool` | Inject `new Date().toISOString()` into system prompt at request time |

### New (5 tools — platform modes)

| Tool | Modes | Description |
|---|---|---|
| `createContent` | content-list, platform | Create new content record (wraps content-repository) |
| `createDashboard` | analytics, platform | Create new dashboard record |
| `createForm` | forms, platform | Create new form record |
| `updateContent` | editor, platform | Update content status/title/metadata |
| `deleteContent` | platform | Delete a content record |

### Tool sets per mode

```typescript
function getToolsForMode(mode: ChatMode) {
  const research = { webSearch, serpAnalysis, webCrawl, relatedKeywords }
  const rag     = { searchPreviousContent }
  const write   = { insertElement, replaceText, deleteText, formatText, proposeSuggestion, addEditorComment }
  const fm      = { editTitle, editDescription, editKeywords, editSlug }
  const seo     = { injectKeywords, addInternalLinks, addExternalLinks, generateQuickAnswer }
  const analyze = { analyzeContent }
  const crud    = { createContent, createDashboard, createForm, updateContent, deleteContent }

  switch (mode) {
    case "editor":       return { ...write, ...fm, ...seo, ...analyze, ...research, ...rag, updateContent }
    case "content-list": return { ...research, createContent }
    case "analytics":    return { ...research, createDashboard }
    case "forms":        return { ...research, createForm }
    case "platform":     return { ...research, ...crud }
    default:             return { ...research }
  }
}
```

---

## Agents to Delete

- `platform-router-agent.ts`
- `content-network-agent.ts`
- `content-agent.ts`
- `research-agent.ts`
- `writer-agent.ts`
- `seo-auditor-agent.ts`
- `reviewer-agent.ts`

Keep: `fimAgent`, `inlineEditAgent` (not part of chat flow).

---

## Implementation Steps

### Phase 1: Tool consolidation

1. Create `packages/agents/src/mastra/tools/editor/insert-element-tool.ts` — merges 5 insert tools
2. Create `packages/agents/src/mastra/tools/editor/analyze-content-tool.ts` — merges 13 analysis tools
3. Delete: `insert-text-tool`, `insert-heading-tool`, `insert-list-tool`, `insert-code-block-tool`, `insert-table-tool`
4. Delete: entire `tools/analysis/` folder
5. Delete: `optimize-title-tool`, `optimize-meta-tool`, `improve-readability-tool`
6. Delete: `competitor-content-tool`, `content-gap-tool`, `fact-finder-tool`, `research-completeness-tool`
7. Delete: `rag/graph-search-tool`, `memory/get-instructions-tool`, `date-tool`

### Phase 2: Build platform CRUD tools

1. Create `packages/agents/src/mastra/tools/platform/` folder
2. `create-content-tool.ts` — wraps `createContent` from `@packages/database/repositories/content-repository`
3. `create-dashboard-tool.ts` — wraps dashboard-repository
4. `create-form-tool.ts` — wraps form-repository
5. `update-content-tool.ts` — wraps `updateContent` from content-repository
6. `delete-content-tool.ts` — wraps `deleteContent` from content-repository

Tools get `teamId` and `userId` from `requestContext` (already set there: `userId` is set; add `teamId`).

### Phase 3: Build `tecoAgent`

1. Create `packages/agents/src/mastra/agents/teco-agent.ts`
2. `getToolsForMode(mode)` function — dynamic tool injection
3. `buildInstructions(requestContext)` — renders `<context_atual>` block + mode-specific instructions
4. Preserve all existing writer/SEO/research instruction text from old agents
5. Register in `mastra/index.ts` as `tecoAgent`, remove old agents

### Phase 4: Store + frontend wiring

1. Update `chatContextStore`:
   - Replace `router: "auto" | "content"` with `mode: ChatMode`
   - Replace `setChatContext(router, contextId)` with `setChatMode(mode, contextId?)`
   - Keep `resetChatContext`, `setChatModel`, `setChatThinkingBudget`
2. Update `use-teco-runtime.ts`: send `mode` instead of `router` in request body
3. Update route loaders: `setChatMode("editor", contentId)`, `setChatMode("content-list")`, etc.
4. Update `teco-chat-tab.tsx` and `thread.tsx`: remove router/mode selector UI (mode is now auto from route)

### Phase 5: Server wiring

1. Update `/api/chat/$.ts`:
   - Accept `mode` from request body (replaces `router`)
   - Pass `mode` into `requestContext`
   - Load context data per mode (content metadata for editor, etc.)
   - Remove `ROUTER_PREFIX_MAP` and prefix injection logic
   - Call `tecoAgent` directly instead of `platformRouterAgent`
2. Remove `contentCreationWorkflow` references if they use old agents

### Phase 6: Cleanup

1. Delete all old agent files (7 agents)
2. Update `content-creation-workflow.ts` to use `tecoAgent` directly
3. Update all `setChatContext` call sites to use `setChatMode`
4. Run typecheck to catch any missed references

---

## Files Changed

```
packages/agents/src/mastra/
├── agents/
│   ├── teco-agent.ts            ← NEW (single agent)
│   ├── fim-agent.ts             ← unchanged
│   ├── inline-edit-agent.ts     ← unchanged
│   ├── content-agent.ts         ← DELETE
│   ├── content-network-agent.ts ← DELETE
│   ├── platform-router-agent.ts ← DELETE
│   ├── research-agent.ts        ← DELETE
│   ├── writer-agent.ts          ← DELETE
│   ├── seo-auditor-agent.ts     ← DELETE
│   └── reviewer-agent.ts        ← DELETE
├── tools/
│   ├── editor/
│   │   ├── insert-element-tool.ts  ← NEW
│   │   ├── analyze-content-tool.ts ← NEW
│   │   ├── insert-text-tool.ts     ← DELETE
│   │   ├── insert-heading-tool.ts  ← DELETE
│   │   ├── insert-list-tool.ts     ← DELETE
│   │   ├── insert-code-block-tool.ts ← DELETE
│   │   ├── insert-table-tool.ts    ← DELETE
│   │   ├── optimize-title-tool.ts  ← DELETE
│   │   ├── optimize-meta-tool.ts   ← DELETE
│   │   └── improve-readability-tool.ts ← DELETE
│   ├── analysis/ (entire folder)   ← DELETE
│   ├── platform/                   ← NEW folder
│   │   ├── create-content-tool.ts
│   │   ├── create-dashboard-tool.ts
│   │   ├── create-form-tool.ts
│   │   ├── update-content-tool.ts
│   │   └── delete-content-tool.ts
│   ├── research/
│   │   ├── competitor-content-tool.ts    ← DELETE
│   │   ├── content-gap-tool.ts           ← DELETE
│   │   ├── fact-finder-tool.ts           ← DELETE
│   │   └── research-completeness-tool.ts ← DELETE
│   ├── rag/
│   │   └── graph-search-tool.ts          ← DELETE
│   ├── memory/
│   │   └── get-instructions-tool.ts      ← DELETE
│   └── date-tool.ts                      ← DELETE
└── index.ts                              ← updated

apps/web/src/
├── routes/api/chat/$.ts                  ← updated
├── routes/_authenticated/**/*.tsx        ← loaders updated
├── features/teco-chat/
│   ├── hooks/use-teco-runtime.ts         ← mode instead of router
│   └── stores/chat-context-store.ts      ← mode replaces router
```
