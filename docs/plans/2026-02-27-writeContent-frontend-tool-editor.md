# writeContent Frontend Tool — Editor Streaming Redesign

**Date:** 2026-02-27
**Branch:** 749-editor-integrar-tanstack-db-electricsql-para-live-queries-no-editor-de-conteúdo

---

## Problem

The current editor agent uses 8+ specialized tools (`insertElement`, `deleteText`, `formatText`, `proposeSuggestion`, `addEditorComment`, etc.) to write content. Each tool call:

1. Executes on the backend
2. Generates markdown output
3. Calls `onBodyUpdate` → DB write → Electric CDC → `useLiveQuery` → `editor.tf.setValue()`

This flow is indirect (network round-trips, DB overhead) and forces the agent to think in "operations" (type, position, element kind) rather than just writing markdown.

---

## Design

### Core Idea

Replace all write tools with:
- **One `writeContent({ markdown })` tool** — agent writes a section, frontend writes to Plate instantly
- **Keep `replaceText`** — for surgical edits on existing content

The agent writes markdown. The frontend applies it directly to the Plate editor via `makeAssistantToolUI` + `addResult`. The DB is also updated async (persistence without blocking UX).

---

## Data Flow

### Writing new content (creation)

```
Agent calls writeContent({ markdown: "## Section\n\nParagraph..." })
  → assistant-ui receives tool call part on frontend
  → makeAssistantToolUI render fires
  → editorContentStore.applyMarkdown(markdown) → plateEditorRef.tf.setValue(...)
  → addResult({ success: true }) unblocks agent
  → Backend stub also calls onBodyUpdate async → DB write → Electric CDC
  → lastAppliedBodyRef dedup in editor-page.tsx prevents Electric re-applying
```

### Surgical edits

```
Agent calls replaceText({ searchText: "old", replaceWith: "new" })
  → backend executes, calls onBodyUpdate with patched full markdown
  → DB write → Electric CDC → editor-page.tsx applies update
  (no change from today)
```

---

## What Changes

### Remove (from editor mode tools)

| Tool | Why |
|------|-----|
| `insertElement` | Replaced by `writeContent` |
| `deleteText` | Agent rewrites section via `writeContent` instead |
| `formatText` | Agent includes formatting in markdown directly |
| `proposeSuggestion` | Out of scope for now |
| `addEditorComment` | Out of scope for now |

### Keep

| Tool | Why |
|------|-----|
| `replaceText` | Surgical edits — still backend + `onBodyUpdate` |
| `readContentBody` | Agent reads current state before editing |
| `editTitle` / `editDescription` / `editSlug` / `editKeywords` | Frontmatter — unchanged |
| All research/analysis tools | Unchanged |

### New: `writeContent` backend stub

**File:** `packages/agents/src/mastra/tools/editor/write-content-tool.ts`

```typescript
export const writeContentTool = createTool({
  id: "write-content",
  description: "Write a markdown section to the editor",
  inputSchema: z.object({
    markdown: z.string().describe("Markdown content for this section"),
  }),
  execute: async ({ markdown }, { requestContext }) => {
    // Async DB persistence via existing onBodyUpdate
    const onBodyUpdate = requestContext?.get("onBodyUpdate");
    if (onBodyUpdate) {
      await onBodyUpdate("write-content", { markdown });
    }
    return { success: true };
  },
});
```

### New: Editor content store (singleton)

**File:** `apps/web/src/features/editor/stores/editor-content-store.ts`

Module-level singleton (like `orpcChatTransport`). Editor page registers a `setContent` callback on mount. Tool UI calls `applyMarkdown(markdown)` which delegates to the registered callback.

```typescript
type EditorContentStore = {
  applyMarkdown: (markdown: string) => void;
  register: (fn: (markdown: string) => void) => void;
  unregister: () => void;
};
```

### New: `makeAssistantToolUI` for `write-content`

**File:** `apps/web/src/features/teco-chat/ui/tool-components/write-content-tool.tsx`

```typescript
export const WriteContentToolUI = makeAssistantToolUI<
  { markdown: string },
  { success: boolean }
>({
  toolName: "write-content",
  render: ({ args, status, addResult }) => {
    useEffect(() => {
      if (status.type === "running" && args.markdown) {
        editorContentStore.applyMarkdown(args.markdown);
        addResult({ success: true });
      }
    }, [args.markdown, status.type]);

    return <EditorTool toolName="write-content" status={status} args={JSON.stringify(args)} />;
  },
});
```

Registered in `thread.tsx` alongside existing tool UIs:
```typescript
tools: {
  by_name: {
    "write-content": WriteContentTool, // makeAssistantToolUI component
    replaceText: EditorTool,
    // ...
  }
}
```

### Agent prompt change

**File:** `packages/agents/src/mastra/agents/teco-agent.ts`

Editor mode `getModeInstructions`:

```
Before (creation sequence):
  5. Write body section by section:
     - 1 call insertElement(type="heading") for H2
     - 1 call insertElement(type="text") with ALL paragraphs (min 200 words)

After (creation sequence):
  5. Write body section by section:
     - 1 call writeContent({ markdown }) per section
     - Include the H2 heading + all paragraphs in the same markdown string
     - Min 200 words per section call
```

---

## Persistence Strategy

Both paths update the DB:

1. **Frontend path (instant):** `makeAssistantToolUI` writes to editor immediately
2. **Backend path (async):** Backend stub calls `onBodyUpdate` → DB → Electric CDC
3. **Dedup:** `lastAppliedBodyRef` in `editor-page.tsx` prevents Electric from re-applying what the frontend already wrote

No change needed in `editor-page.tsx` — the dedup is already there.

---

## Files to Touch

| File | Change |
|------|--------|
| `packages/agents/src/mastra/tools/editor/write-content-tool.ts` | New file |
| `packages/agents/src/mastra/agents/teco-agent.ts` | Register `writeContent`, remove old write tools, update system prompt |
| `apps/web/src/features/editor/stores/editor-content-store.ts` | New singleton store |
| `apps/web/src/features/editor/ui/editor-page.tsx` | Register callback in store on mount |
| `apps/web/src/features/teco-chat/ui/tool-components/write-content-tool.tsx` | New `makeAssistantToolUI` component |
| `apps/web/src/features/teco-chat/ui/thread.tsx` | Register `WriteContentToolUI`, remove old tool entries |
| `apps/web/src/features/teco-chat/ui/tool-components/tool-display-config.ts` | Add `write-content` entry |
