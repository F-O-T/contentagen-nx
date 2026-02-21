# Remove Lexical Editor, Frontmatter & Chat Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete the old Lexical editor, the entire frontmatter UI system, and the chat sidebar; consolidate all remaining editor code into `apps/web/src/features/editor/`.

**Architecture:** The Plate.js `PlateEditor` (already built) replaces the Lexical editor. The chat sidebar (powered by `@assistant-ui/react`) is removed entirely — "Agent 2.0" will be added later. Frontmatter fields (title, description, slug, keywords) still live in the DB but the inline YAML editor and AI tool cards for them are deleted. All surviving editor code moves into `features/editor/`. Routes still live in `routes/` but import exclusively from `features/editor/`.

**Tech Stack:** TanStack Router (file-based routes), Plate.js, oRPC, Bun

---

## What Survives (do NOT delete)

- `apps/web/src/features/editor/plate/` — entire Plate.js integration
- `apps/web/src/integrations/orpc/router/agent.ts` — keep `copilotStream`, `aiCommandStream`, `executeUnifiedAgent`; **remove `editStream`** (Lexical-only)
- `apps/web/src/routes/_authenticated/$slug/$teamSlug/_editor/` — route files stay in `routes/`
- `apps/web/src/features/content/` — content list/table/hooks unrelated to editor

## What Gets Deleted (complete list)

### Lexical Editor Core
- `features/editor/ai/edit.ts`
- `features/editor/ai/streaming.ts`
- `features/editor/ai/tool-executor.ts`
- `features/editor/core/config.ts`
- `features/editor/core/image-node.tsx`
- `features/editor/core/theme.ts`
- `features/editor/core/transformers.ts`
- `features/editor/diagnostics/` (all 3 files)
- `features/editor/plugins/edit-plugin.tsx`
- `features/editor/plugins/floating-toolbar.tsx`
- `features/editor/plugins/markdown-paste.tsx`
- `features/editor/plugins/selection-context-plugin.tsx`
- `features/editor/spelling/` (all 3 files)
- `features/editor/stores/diagnostics-store.ts`
- `features/editor/stores/diff-store.ts`
- `features/editor/stores/edit-store.ts`
- `features/editor/ui/content-editor.tsx`
- `features/editor/ui/content-editor-lazy.tsx`
- `features/editor/ui/diff-view.tsx`
- `features/editor/ui/editor-statusline.tsx`
- `features/editor/ui/edit-panel.tsx`
- `features/editor/schemas.ts`
- `features/editor/utils.ts`

### Chat / Assistant-UI
- `layout/editor/ui/assistant-chat-sidebar.tsx`
- `layout/editor/ui/enhanced-composer.tsx`
- `layout/editor/ui/chat/` (entire directory — 6 tool-card files)
- `layout/editor/hooks/use-contentta-runtime.ts`
- `layout/editor/hooks/use-streaming-tool-bridge.ts`
- `features/content/lib/assistant-runtime-adapter.ts`

### Frontmatter
- `layout/editor/ui/inline-frontmatter.tsx`

### Entire layout/editor (after extracting survivors)
- `layout/editor/hooks/use-editor-state.ts`
- `layout/editor/hooks/use-fim-stream.ts`
- `layout/editor/hooks/use-manual-save.ts`
- `layout/editor/stores/editor-context-store.ts`
- `layout/editor/ui/diagnostics-panel.tsx`
- `layout/editor/ui/editor-command-palette.tsx`
- `layout/editor/ui/editor-config-panel.tsx`
- `layout/editor/ui/editor-nav-bar.tsx`
- `layout/editor/ui/editor-standalone-layout.tsx`
- `layout/editor/ui/seo-audit-sidebar.tsx`
- `layout/editor/ui/editor-layout.tsx` (replaced by new simplified version)
- `layout/editor/ui/content-editor-page.tsx` (replaced by new simplified version)

---

### Task 1: Delete Lexical Editor Core Files

**Files:**
- Delete: all files listed under "Lexical Editor Core" above

**Step 1: Verify what's there**

```bash
ls /home/yorizel/Documents/contentta-nx/apps/web/src/features/editor/ai/
ls /home/yorizel/Documents/contentta-nx/apps/web/src/features/editor/core/
ls /home/yorizel/Documents/contentta-nx/apps/web/src/features/editor/plugins/
ls /home/yorizel/Documents/contentta-nx/apps/web/src/features/editor/spelling/
ls /home/yorizel/Documents/contentta-nx/apps/web/src/features/editor/diagnostics/
ls /home/yorizel/Documents/contentta-nx/apps/web/src/features/editor/stores/
ls /home/yorizel/Documents/contentta-nx/apps/web/src/features/editor/ui/
```

**Step 2: Delete all Lexical editor core directories and files**

```bash
cd /home/yorizel/Documents/contentta-nx

git rm -rf apps/web/src/features/editor/ai/
git rm -rf apps/web/src/features/editor/core/
git rm -rf apps/web/src/features/editor/diagnostics/
git rm -rf apps/web/src/features/editor/spelling/
git rm apps/web/src/features/editor/plugins/edit-plugin.tsx
git rm apps/web/src/features/editor/plugins/floating-toolbar.tsx
git rm apps/web/src/features/editor/plugins/markdown-paste.tsx
git rm apps/web/src/features/editor/plugins/selection-context-plugin.tsx
git rm -rf apps/web/src/features/editor/stores/
git rm apps/web/src/features/editor/ui/content-editor.tsx
git rm apps/web/src/features/editor/ui/content-editor-lazy.tsx
git rm apps/web/src/features/editor/ui/diff-view.tsx
git rm apps/web/src/features/editor/ui/editor-statusline.tsx
git rm apps/web/src/features/editor/ui/edit-panel.tsx
git rm apps/web/src/features/editor/schemas.ts
git rm apps/web/src/features/editor/utils.ts
```

Note: Some files may not exist — skip `git rm` errors for missing files with `|| true`.

**Step 3: Commit**

```bash
git commit -m "refactor(editor): delete Lexical editor core files"
```

---

### Task 2: Delete Chat / Assistant-UI Infrastructure

**Files:**
- Delete: all files listed under "Chat / Assistant-UI" above

**Step 1: Delete chat files**

```bash
cd /home/yorizel/Documents/contentta-nx

git rm apps/web/src/layout/editor/ui/assistant-chat-sidebar.tsx
git rm apps/web/src/layout/editor/ui/enhanced-composer.tsx
git rm -rf apps/web/src/layout/editor/ui/chat/
git rm apps/web/src/layout/editor/hooks/use-contentta-runtime.ts
git rm apps/web/src/layout/editor/hooks/use-streaming-tool-bridge.ts
git rm apps/web/src/features/content/lib/assistant-runtime-adapter.ts
```

**Step 2: Remove `editStream` from agent.ts router**

Open `apps/web/src/integrations/orpc/router/agent.ts` and delete:
- The entire `editStream` export (async function* + procedure)
- The `inlineEditAgent` import if only used by editStream
- The `editStream` from the router exports object

Also remove `editStream` from wherever it's exported in the router index.

**Step 3: Also remove @assistant-ui imports from any remaining files**

```bash
grep -rn "@assistant-ui\|AssistantChatSidebar\|useContenttaRuntime\|useStreamingToolBridge" \
  /home/yorizel/Documents/contentta-nx/apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v "test"
```

For each file found, remove the import or the entire file if chat was its only purpose.

**Step 4: Commit**

```bash
git commit -m "refactor(editor): delete chat sidebar and assistant-ui infrastructure"
```

---

### Task 3: Delete Frontmatter UI + Remaining layout/editor

**Step 1: Delete frontmatter and remaining layout/editor files**

```bash
cd /home/yorizel/Documents/contentta-nx

git rm apps/web/src/layout/editor/ui/inline-frontmatter.tsx
git rm apps/web/src/layout/editor/hooks/use-editor-state.ts
git rm apps/web/src/layout/editor/hooks/use-fim-stream.ts
git rm apps/web/src/layout/editor/hooks/use-manual-save.ts
git rm apps/web/src/layout/editor/stores/editor-context-store.ts
git rm apps/web/src/layout/editor/ui/diagnostics-panel.tsx
git rm apps/web/src/layout/editor/ui/editor-command-palette.tsx
git rm apps/web/src/layout/editor/ui/editor-config-panel.tsx
git rm apps/web/src/layout/editor/ui/editor-nav-bar.tsx
git rm apps/web/src/layout/editor/ui/editor-standalone-layout.tsx
git rm apps/web/src/layout/editor/ui/seo-audit-sidebar.tsx
```

The main `editor-layout.tsx` and `content-editor-page.tsx` stay for now — they'll be replaced in Task 4.

**Step 2: Check for any frontmatter oRPC procedures**

```bash
grep -rn "editTitle\|editDescription\|editSlug\|editKeywords\|frontmatter" \
  /home/yorizel/Documents/contentta-nx/apps/web/src/integrations/orpc/router/ --include="*.ts" | grep -v "test"
```

If there are dedicated frontmatter procedures in the oRPC router, remove them.

**Step 3: Commit**

```bash
git commit -m "refactor(editor): delete frontmatter UI, layout/editor hooks, stores and auxiliary panels"
```

---

### Task 4: Create Simplified Editor Page in features/editor/

Replace the complex `EditorLayout` + `ContentEditorPage` with two simple files in `features/editor/`.

**Files:**
- Create: `apps/web/src/features/editor/ui/editor-page.tsx`
- Create: `apps/web/src/features/editor/ui/editor-layout.tsx`

**Step 1: Read what the current route passes to ContentEditorPage**

```bash
cat /home/yorizel/Documents/contentta-nx/apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_editor/\$contentId.tsx
cat /home/yorizel/Documents/contentta-nx/apps/web/src/layout/editor/ui/content-editor-page.tsx
cat /home/yorizel/Documents/contentta-nx/apps/web/src/layout/editor/ui/editor-layout.tsx
```

Understand:
- What data the route passes to the page (contentId, teamId, etc.)
- What oRPC queries are used (content.getById or similar)
- What save/publish actions are triggered

**Step 2: Create `apps/web/src/features/editor/ui/editor-layout.tsx`**

A minimal layout shell — just a vertical flex container with a top nav bar placeholder and the editor content area. No chat sidebar, no diagnostics, no SEO panel.

```tsx
// apps/web/src/features/editor/ui/editor-layout.tsx
import type { ReactNode } from "react";

interface EditorLayoutProps {
  navbar: ReactNode;
  children: ReactNode; // the PlateEditor
}

export function EditorLayout({ navbar, children }: EditorLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="shrink-0 border-b">{navbar}</div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
```

**Step 3: Create `apps/web/src/features/editor/ui/editor-page.tsx`**

Replaces `ContentEditorPage`. Loads content, renders the PlateEditor.

```tsx
// apps/web/src/features/editor/ui/editor-page.tsx
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";
import { PlateEditor } from "../plate/plate-editor";
import { EditorLayout } from "./editor-layout";

interface EditorPageProps {
  contentId: string;
  teamId: string;
}

export function EditorPage({ contentId, teamId }: EditorPageProps) {
  const { data: content } = useSuspenseQuery(
    orpc.content.getById.queryOptions({ input: { contentId, teamId } })
  );

  const updateContent = useMutation(
    orpc.content.update.mutationOptions()
  );

  return (
    <EditorLayout
      navbar={
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-medium truncate">{content.title}</span>
          <button
            type="button"
            onClick={() =>
              updateContent.mutate({ contentId, teamId, body: { /* markdown */ } })
            }
          >
            Salvar
          </button>
        </div>
      }
    >
      <PlateEditor
        contentId={contentId}
        className="h-full"
      />
    </EditorLayout>
  );
}
```

Adjust the actual oRPC procedure names by reading the content router:
```bash
grep -n "export const get\|export const update" \
  /home/yorizel/Documents/contentta-nx/apps/web/src/integrations/orpc/router/content.ts | head -10
```

**Step 4: Delete the old layout/editor page files**

```bash
git rm /home/yorizel/Documents/contentta-nx/apps/web/src/layout/editor/ui/content-editor-page.tsx
git rm /home/yorizel/Documents/contentta-nx/apps/web/src/layout/editor/ui/editor-layout.tsx
# Remove the now-empty layout/editor directory if empty
find /home/yorizel/Documents/contentta-nx/apps/web/src/layout/editor -empty -type d -delete
```

**Step 5: Commit**

```bash
git add apps/web/src/features/editor/ui/editor-page.tsx \
        apps/web/src/features/editor/ui/editor-layout.tsx
git commit -m "feat(editor): add simplified EditorPage and EditorLayout in features/editor"
```

---

### Task 5: Update Routes to Use New features/editor Components

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_editor/$contentId.tsx`

**Step 1: Read the route file**

```bash
cat /home/yorizel/Documents/contentta-nx/apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_editor/\$contentId.tsx
```

**Step 2: Replace old imports with new ones**

Replace:
```typescript
import { ContentEditorPage } from "@/layout/editor/ui/content-editor-page";
```

With:
```typescript
import { EditorPage } from "@/features/editor/ui/editor-page";
```

Replace the component usage: `<ContentEditorPage ...>` → `<EditorPage contentId={contentId} teamId={teamId} />`

Also check if the `_editor.tsx` layout route references anything from `layout/editor/`:
```bash
cat /home/yorizel/Documents/contentta-nx/apps/web/src/routes/_authenticated/\$slug/\$teamSlug/_editor.tsx
```

**Step 3: Run typecheck to find all broken imports**

```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "error TS\|Cannot find module" | grep -v "test\|__tests__" | head -40
```

Fix every error systematically. Most will be imports of deleted files.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(editor): update routes to use features/editor components"
```

---

### Task 6: Remove @lexical and @assistant-ui Packages

**Step 1: Check what @lexical and @assistant-ui packages are still imported**

```bash
grep -rn "@lexical\|@assistant-ui\|lexical" \
  /home/yorizel/Documents/contentta-nx/apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v "test\|node_modules" | grep "import "
```

If any remain, those files must still be updated. Fix them first.

**Step 2: Remove packages from apps/web/package.json**

```bash
cat /home/yorizel/Documents/contentta-nx/apps/web/package.json | grep -E "@lexical|@assistant-ui|lexical"
```

For each package listed, remove it:
```bash
bun remove @lexical/react @lexical/list @lexical/markdown @lexical/rich-text @lexical/link @lexical/table @lexical/html @lexical/code @lexical/selection @lexical/utils --filter web
bun remove @assistant-ui/react @assistant-ui/react-playground --filter web
bun remove lexical --filter web
```

Remove only packages that have zero remaining imports after the cleanup. If a package is still imported somewhere you missed, remove the import first.

**Step 3: Verify removal**

```bash
grep -rn "@lexical\|@assistant-ui" \
  /home/yorizel/Documents/contentta-nx/apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v "test\|node_modules"
# Should be empty
```

**Step 4: Commit**

```bash
git add apps/web/package.json bun.lockb
git commit -m "chore(editor): remove @lexical and @assistant-ui packages"
```

---

### Task 7: Final Cleanup and Typecheck

**Step 1: Search for any remaining stale references**

```bash
cd /home/yorizel/Documents/contentta-nx

# Check for EditorLayout, ContentEditorPage from old location
grep -rn "layout/editor\|EditorLayout\|ContentEditorPage\|InlineFrontmatter\|AssistantChatSidebar\|editStream\b" \
  apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v "test\|node_modules" | grep "import "
```

Delete or fix any remaining imports.

**Step 2: Run full monorepo typecheck**

```bash
bun run typecheck 2>&1 | grep "error TS" | grep -v "test\|__tests__" | head -30
```

Fix ALL non-test errors.

**Step 3: Check if layout/editor directory is now empty**

```bash
find /home/yorizel/Documents/contentta-nx/apps/web/src/layout/editor -type f
# Should be empty — if not, investigate what remains
```

If empty:
```bash
git rm -rf /home/yorizel/Documents/contentta-nx/apps/web/src/layout/editor/
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore(editor): final cleanup — remove stale references and empty directories"
```

---

## Expected Final Structure

```
apps/web/src/features/editor/
├── plate/
│   ├── hooks/
│   │   └── use-editor-ai-chat.ts    ← Plate.js context injection
│   ├── plate-editor.tsx             ← Main Plate.js editor component
│   └── plugins/
│       ├── ai-kit.tsx               ← AIPlugin + AIChatPlugin (oRPC)
│       └── copilot-kit.tsx          ← CopilotPlugin (oRPC)
└── ui/
    ├── editor-layout.tsx            ← Simple shell (navbar + content area)
    └── editor-page.tsx              ← Data-fetching page component

apps/web/src/routes/_authenticated/$slug/$teamSlug/_editor/
├── _editor.tsx      ← Route layout
└── $contentId.tsx   ← Route → EditorPage
```

## Gotchas

**1. `editStream` removal from agent.ts**
The procedure uses `inlineEditAgent` — check if `inlineEditAgent` is also imported elsewhere before removing that import.

**2. `@assistant-ui/react` in packages/ui**
Check if `packages/ui/package.json` also has `@assistant-ui` — the shadcn CLI may have added it there. Remove from both places.

**3. layout/dashboard/ is separate**
Do NOT delete `apps/web/src/layout/dashboard/` — that's the dashboard layout, completely unrelated.

**4. content-table-columns.tsx uses contentId**
The content feature files in `features/content/ui/` are for the content list view (not the editor). Leave them alone.

**5. oRPC router index may export editStream**
After removing `editStream` from `agent.ts`, also check and update the router index at `apps/web/src/integrations/orpc/router/index.ts`.
