# Electric Agent-to-Editor Writes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Route writer-agent tool outputs directly to `content.body` in Postgres so Electric CDC streams them to the editor in real-time, replacing the broken SSE-interception approach.

**Architecture:** Each editor tool (insert-text, insert-heading, etc.) calls an `onBodyUpdate` callback injected via `requestContext`. The callback (owned by the `/api/chat/$` route) accumulates markdown, converts it to PlateJS JSON server-side using `@platejs/markdown`, and writes to `content.body` via the existing `updateContent` repository. Electric CDC propagates each write to the client. `editor-page.tsx` watches `liveContent.body` from `useLiveQuery` and auto-applies updates to the PlateJS editor.

**Tech Stack:** Mastra tools (`createTool`), `requestContext` (Mastra context pattern), `@platejs/markdown` (`MarkdownPlugin` + `createPlateEditor`), `@packages/database/repositories/content-repository` (`updateContent`), `@tanstack/react-db` (`useLiveQuery`), Electric SQL CDC, PlateJS (`editor.tf.setValue`)

---

### Task 1: Add `onBodyUpdate` to CustomRequestContext

**Files:**
- Modify: `packages/agents/src/mastra/index.ts`

**Context:** `CustomRequestContext` currently holds `userId`, `writerId`, `contentId`, etc. We add an optional async callback that editor tools call after producing content. The callback is injected by the caller (API route) — the agents package stays DB-free.

**Step 1: Add the callback type to `CustomRequestContext`**

Find the `CustomRequestContext` type definition (look for `export type CustomRequestContext`). Add:

```typescript
onBodyUpdate?: (toolName: string, output: Record<string, unknown>) => Promise<void>;
```

**Step 2: Ensure `createRequestContext` passes it through**

`createRequestContext` calls `requestContext.set(key, value)` for each field. Verify it already iterates all keys or add explicit handling for `onBodyUpdate`. The pattern is the same as `contentId` — no special treatment needed, just include in the type and the function picks it up.

**Step 3: Verify typecheck**

```bash
bun run typecheck 2>&1 | grep -E "index.ts|onBodyUpdate" | head -20
```

Expected: no errors for this file.

**Step 4: Commit**

```bash
git add packages/agents/src/mastra/index.ts
git commit -m "feat(agents): add onBodyUpdate callback to CustomRequestContext"
```

---

### Task 2: Create server-side markdown-to-PlateJS utility

**Files:**
- Create: `apps/web/src/features/editor/utils/markdown-to-plate.ts`

**Context:** `@platejs/markdown` exports `MarkdownPlugin`. Calling `editor.api.markdown.deserialize(md)` on a minimal Plate editor instance converts markdown to Plate nodes. This runs server-side (no DOM, pure Slate). `MarkdownKit` in `@packages/ui` shows the config pattern — we mirror it without React-only plugins.

**Step 1: Create the utility**

```typescript
// apps/web/src/features/editor/utils/markdown-to-plate.ts
import { MarkdownPlugin } from "@platejs/markdown";
import type { Value } from "platejs";
import { createPlateEditor } from "platejs";
import remarkGfm from "remark-gfm";

let _editor: ReturnType<typeof createPlateEditor> | null = null;

function getEditor() {
   if (!_editor) {
      _editor = createPlateEditor({
         plugins: [
            MarkdownPlugin.configure({
               options: { remarkPlugins: [remarkGfm] },
            }),
         ],
      });
   }
   return _editor;
}

export function markdownToPlateValue(markdown: string): Value {
   const editor = getEditor();
   return editor.api.markdown.deserialize(markdown) as Value;
}
```

**Note:** The editor instance is cached (module singleton) to avoid recreating it on every tool call. If `createPlateEditor` throws a DOM error in the server context, replace with a `remark`-based manual converter and file a follow-up.

**Step 2: Quick smoke test (manual)**

Add a temporary `console.log` in the chat route calling `markdownToPlateValue("# Hello\n\nWorld")` and check the server log for a valid Plate nodes array. Remove after verifying.

**Step 3: Commit**

```bash
git add apps/web/src/features/editor/utils/markdown-to-plate.ts
git commit -m "feat(editor): add server-side markdownToPlateValue utility"
```

---

### Task 3: Inject `onBodyUpdate` in the chat API route

**Files:**
- Modify: `apps/web/src/routes/api/chat/$.ts`

**Context:** The route already has `contextId` and `db` available (add `db` import from `server-instances`). When `contextId` is present, we build an `onBodyUpdate` callback that accumulates markdown from each tool output and writes the growing PlateJS body to DB on every call.

**Step 1: Add imports**

```typescript
import { db } from "@/integrations/orpc/server-instances";
import { updateContent } from "@packages/database/repositories/content-repository";
import { markdownToPlateValue } from "@/features/editor/utils/markdown-to-plate";
```

**Step 2: Define the `extractMarkdown` helper inside the POST handler** (before `createRequestContext` call)

```typescript
function extractMarkdown(
   toolName: string,
   output: Record<string, unknown>,
): string {
   const md = output.markdown as string | undefined;
   if (!md) return "";
   // Ensure each tool output is on its own line with spacing
   return `\n\n${md.trim()}`;
}
```

**Step 3: Build the callback when `contextId` is present**

Inside the POST handler, after destructuring `contextId`, add:

```typescript
let bodyAccumulator = "";
const onBodyUpdate =
   contextId
      ? async (toolName: string, output: Record<string, unknown>) => {
           const chunk = extractMarkdown(toolName, output);
           if (!chunk) return;
           bodyAccumulator += chunk;
           try {
              const plateValue = markdownToPlateValue(bodyAccumulator.trim());
              await updateContent(db, contextId, {
                 body: JSON.stringify(plateValue),
              });
           } catch {
              // best-effort — don't crash the stream if DB write fails
           }
        }
      : undefined;
```

**Step 4: Pass `onBodyUpdate` to `createRequestContext`**

```typescript
requestContext: createRequestContext({
   userId,
   ...(contextId ? { contentId: contextId, onBodyUpdate } : {}),
}),
```

**Step 5: Verify typecheck**

```bash
bun run typecheck 2>&1 | grep "chat/\$.ts" | head -20
```

Expected: no errors.

**Step 6: Commit**

```bash
git add apps/web/src/routes/api/chat/$.ts
git commit -m "feat(chat): inject onBodyUpdate callback for Electric editor writes"
```

---

### Task 4: Wire `onBodyUpdate` into the 6 content-producing editor tools

**Files:**
- Modify: `packages/agents/src/mastra/tools/editor/insert-text-tool.ts`
- Modify: `packages/agents/src/mastra/tools/editor/insert-heading-tool.ts`
- Modify: `packages/agents/src/mastra/tools/editor/insert-list-tool.ts`
- Modify: `packages/agents/src/mastra/tools/editor/insert-code-block-tool.ts`
- Modify: `packages/agents/src/mastra/tools/editor/insert-table-tool.ts`
- Modify: `packages/agents/src/mastra/tools/editor/replace-text-tool.ts`

**Context:** Mastra tools receive `(inputData, context)`. `context?.requestContext` holds the Mastra context. `requestContext.get("onBodyUpdate")` retrieves the callback injected by the API route. The callback is called with `(toolId, result)` **after** building the result object, **before** returning it.

**Pattern to apply to all 6 tools** (show with `insert-text-tool.ts`, repeat for others):

**Step 1: Update `execute` signature to accept context**

Change `execute: async (inputData) =>` to `execute: async (inputData, context) =>`.

**Step 2: Call `onBodyUpdate` before returning**

```typescript
execute: async (inputData, context) => {
   // ... existing logic to build `result` object ...

   const onBodyUpdate = context?.requestContext?.get("onBodyUpdate") as
      | ((toolName: string, output: Record<string, unknown>) => Promise<void>)
      | undefined;

   if (onBodyUpdate) {
      await onBodyUpdate("insert-text", result as Record<string, unknown>);
   }

   return result;
},
```

Change the tool name string to match each tool's `id` field:
- `insert-text-tool.ts` → `"insert-text"`
- `insert-heading-tool.ts` → `"insert-heading"`
- `insert-list-tool.ts` → `"insert-list"`
- `insert-code-block-tool.ts` → `"insert-code-block"`
- `insert-table-tool.ts` → `"insert-table"`
- `replace-text-tool.ts` → `"replace-text"`

**Step 3: Verify typecheck**

```bash
bun run typecheck 2>&1 | grep "tools/editor" | head -20
```

Expected: no errors.

**Step 4: Commit**

```bash
git add packages/agents/src/mastra/tools/editor/insert-text-tool.ts \
        packages/agents/src/mastra/tools/editor/insert-heading-tool.ts \
        packages/agents/src/mastra/tools/editor/insert-list-tool.ts \
        packages/agents/src/mastra/tools/editor/insert-code-block-tool.ts \
        packages/agents/src/mastra/tools/editor/insert-table-tool.ts \
        packages/agents/src/mastra/tools/editor/replace-text-tool.ts
git commit -m "feat(agents): wire onBodyUpdate into editor tools for Electric writes"
```

---

### Task 5: Make editor-page react to Electric body changes

**Files:**
- Modify: `apps/web/src/features/editor/ui/editor-page.tsx`

**Context:** `editor-page.tsx` already has `liveContent` from `useLiveQuery`. Currently only `liveContent.status` is used; `liveContent.body` is ignored. We add a `useEffect` that detects when the body changes due to an agent write (not from this editor's own save), then calls `editor.tf.setValue()` to replace the editor content.

We need a ref to the PlateJS `editor` instance. `PlateEditor` currently receives `onChange` — we also need `onEditorReady` or a ref. Check `plate-editor.tsx` for how to expose the editor instance, or use `useEditorRef()` from `platejs/react` inside a child component. The simplest path: use an `editorRef` prop or a store.

**Step 1: Add `editorRef` prop to `PlateEditor`**

In `plate-editor.tsx`, check if there's already a way to expose the Plate editor instance externally. If not, add an `editorRef` prop:

```typescript
// In PlateEditor props interface
editorRef?: React.MutableRefObject<PlateEditor | null>;

// In the Plate root component, use an effect:
useEffect(() => {
   if (editorRef) editorRef.current = editor; // editor from useEditorRef()
}, [editor, editorRef]);
```

Read `plate-editor.tsx` before editing to find the right insertion point.

**Step 2: In `editor-page.tsx`, track the last-known body and watch for changes**

```typescript
const plateEditorRef = useRef<PlateEditor | null>(null);
const lastAppliedBodyRef = useRef<string | null>(httpContent?.body ?? null);

useEffect(() => {
   const incomingBody = liveContent?.body ?? null;
   if (
      !incomingBody ||
      incomingBody === lastAppliedBodyRef.current ||
      !plateEditorRef.current
   ) {
      return;
   }
   try {
      const parsed = JSON.parse(incomingBody) as Value;
      plateEditorRef.current.tf.setValue(parsed);
      lastAppliedBodyRef.current = incomingBody;
      editorValueRef.current = parsed;
   } catch {
      // malformed body — ignore
   }
}, [liveContent?.body]);
```

**Step 3: Pass `editorRef` to `PlateEditor`**

```tsx
<PlateEditor
   editorRef={plateEditorRef}
   // ... rest of existing props unchanged
/>
```

**Step 4: Verify typecheck**

```bash
bun run typecheck 2>&1 | grep "editor-page\|plate-editor" | head -20
```

**Step 5: Commit**

```bash
git add apps/web/src/features/editor/ui/editor-page.tsx \
        apps/web/src/features/editor/plate/plate-editor.tsx
git commit -m "feat(editor): react to Electric body changes from agent writes"
```

---

### Task 6: Remove old bridge infrastructure

**Files:**
- Delete: `apps/web/src/features/teco-chat/transports/editor-aware-chat-transport.ts`
- Delete: `apps/web/src/features/editor/stores/editor-bridge-store.ts`
- Modify: `apps/web/src/features/editor/plate/plate-editor.tsx` (remove `registerEditorBridge` / `unregisterEditorBridge` calls)
- Modify: `apps/web/src/features/editor/ui/editor-page.tsx` (remove `editor-bridge-save` listener)

**Context:** The `EditorAwareChatTransport` and `EditorBridgeStore` were the old SSE-interception approach. They're no longer used. `use-teco-runtime.ts` was already reverted to `AssistantChatTransport` in the previous session.

**Step 1: Delete the two files**

```bash
rm apps/web/src/features/teco-chat/transports/editor-aware-chat-transport.ts
rm apps/web/src/features/editor/stores/editor-bridge-store.ts
```

**Step 2: Remove bridge registration from `plate-editor.tsx`**

Read `plate-editor.tsx` and remove:
- `import { registerEditorBridge, unregisterEditorBridge } from "@/features/editor/stores/editor-bridge-store"`
- The `useEffect` that calls `registerEditorBridge(...)` and returns `unregisterEditorBridge`
- Any `editor-bridge-save` `dispatchEvent` calls

**Step 3: Remove `editor-bridge-save` listener from `editor-page.tsx`**

Remove the `useEffect` that listens for `"editor-bridge-save"` on `window` (calls `handleSave()`). The save logic is still in `handleSave` — only the event listener goes away.

**Step 4: Verify typecheck**

```bash
bun run typecheck 2>&1 | head -30
```

Expected: no errors referencing the deleted files.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(editor): remove bridge infrastructure replaced by Electric writes"
```

---

### Task 7: Fix `s.contentId` stale reference in thread.tsx

**Files:**
- Modify: `apps/web/src/features/teco-chat/ui/thread.tsx`

**Context:** During the rename (`contentId` → `contextId`) in the previous session, `thread.tsx`'s `Composer` component still reads `s.contentId` from the store (line ~245). This field no longer exists on `ChatContextState` — it should be `s.contextId`. TypeScript catches this but it silently returns `undefined` at runtime, breaking the context-prefill feature.

**Step 1: Find and fix the stale reference**

```bash
grep -n "s\.contentId\|s\.contextId" apps/web/src/features/teco-chat/ui/thread.tsx
```

Change:
```typescript
const contentId = useStore(chatContextStore, (s) => s.contentId);
```
To:
```typescript
const contentId = useStore(chatContextStore, (s) => s.contextId);
```

**Step 2: Verify**

```bash
bun run typecheck 2>&1 | grep "thread.tsx" | head -10
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/features/teco-chat/ui/thread.tsx
git commit -m "fix(chat): correct stale s.contentId → s.contextId in thread Composer"
```

---

## Summary

| Task | What it does |
|------|-------------|
| 1 | Adds `onBodyUpdate` callback type to `CustomRequestContext` |
| 2 | Server-side markdown→PlateJS converter using `@platejs/markdown` |
| 3 | API route injects accumulating DB-write callback when `contextId` present |
| 4 | 6 editor tools call the callback before returning their result |
| 5 | Editor watches `liveContent.body` from Electric and auto-applies agent writes |
| 6 | Removes `EditorAwareChatTransport`, `EditorBridgeStore`, bridge event wiring |
| 7 | Fixes stale `s.contentId` → `s.contextId` in thread Composer |

**Already completed (this session):**
- Electric URL fixed to absolute (`window.location.origin`) — `content-collection.ts`, `discussions-collection.ts`
- SSR guard added to both collection factories
- `content-list-section.tsx` updated with `collection &&` guard
- `use-teco-runtime.ts` reverted to `AssistantChatTransport`
