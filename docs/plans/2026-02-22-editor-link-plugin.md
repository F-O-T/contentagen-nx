# Editor Link Plugin + Internal Linking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Plate.js LinkPlugin with full UI (floating toolbar, input with content search), add internal-links sidebar showing Content Cluster suggestions, redesign the editor header as a fixed Plate toolbar with icon buttons, and add an editable frontmatter section above the editor content.

**Architecture:** `PlateEditor` is extended to accept `meta`, `onMetaChange`, `onSave`, `onBack` props — everything (toolbar, frontmatter, content, sidebar) renders inside a single `<Plate>` context so Plate hooks work everywhere. A new `getSuggestions` procedure on the `relatedContent` router handles bi-directional cluster lookup (content as pillar → satellites, and content as satellite → pillar + siblings). Agent tools are updated to emit cleaner inline markdown links.

**Tech Stack:** `@platejs/link/react`, `@platejs/markdown/react`, `@packages/ui/components/toolbar`, Lucide React icons, oRPC `protectedProcedure`, TanStack Query `useSuspenseQuery`, Zod

---

## Context

### What exists today
- `plate-editor.tsx` — uses bare `LinkPlugin` with no UI (no floating toolbar, no element styling)
- `link-base-kit.tsx` — `BaseLinkPlugin.withComponent(LinkElementStatic)` (static only)
- `editor-page.tsx` — simple header (← Back, title, Save button); passes NO `initialValue` or `onChange` to PlateEditor
- `content.body` — text/markdown field where editor content is stored
- `content.meta` — JSONB: `{ title, description, slug, keywords[] }`
- `relatedContent.listSatellites(pillarId)` — exists but unidirectional (only pillar → satellites)
- Agent tool `addInternalLinks` — inserts blockquote-style links; fine to keep as-is (works on markdown strings)

### Key paths
- Editor component: `apps/web/src/features/editor/plate/plate-editor.tsx`
- Editor page: `apps/web/src/features/editor/ui/editor-page.tsx`
- Editor layout: `apps/web/src/features/editor/ui/editor-layout.tsx`
- Related-content router: `apps/web/src/integrations/orpc/router/related-content.ts`
- UI toolbar primitives: `@packages/ui/components/toolbar` (Radix-based)
- Tooltip: `@packages/ui/components/tooltip`
- Button: `@packages/ui/components/button`
- Link plugin package: `@platejs/link/react` (already installed in catalog:editor)

---

## Phase 1 — Link Plugin UI

### Task 1: Create `link-kit.tsx` — configure LinkPlugin

**Files:**
- Create: `apps/web/src/features/editor/plate/plugins/link-kit.tsx`

**Step 1: Write the file**

```tsx
import { LinkPlugin } from "@platejs/link/react";
import { LinkElement } from "../ui/link-element";
import { LinkFloatingToolbar } from "../ui/link-floating-toolbar";

function isValidUrl(text: string): boolean {
  // Accept relative internal paths (e.g. /conteudo/my-slug)
  if (text.startsWith("/")) return true;
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

export const LinkKit = [
  LinkPlugin.configure({
    options: {
      isUrl: isValidUrl,
    },
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];
```

> **Note:** Verify the exact `render` API against Plate.js v52 docs at https://platejs.org/docs/link.
> If `afterEditable` is not the right key, check for `aboveEditable` or `renderAfterEditable`.

**Step 2: Commit**

```bash
git add apps/web/src/features/editor/plate/plugins/link-kit.tsx
git commit -m "feat(editor): add link-kit plugin configuration"
```

---

### Task 2: Create `link-element.tsx` — render link nodes

**Files:**
- Create: `apps/web/src/features/editor/plate/ui/link-element.tsx`

**Step 1: Write the file**

```tsx
"use client";

import { cn } from "@packages/ui/lib/utils";
import { useLink } from "@platejs/link/react";
import type { PlateElementProps } from "platejs/react";
import { PlateElement } from "platejs/react";

export function LinkElement({
  className,
  children,
  ...props
}: PlateElementProps) {
  const { props: linkProps } = useLink({ element: props.element });

  return (
    <PlateElement
      as="a"
      className={cn(
        "font-medium text-primary underline underline-offset-4",
        "cursor-pointer hover:text-primary/80 transition-colors",
        className,
      )}
      {...linkProps}
      {...props}
    >
      {children}
    </PlateElement>
  );
}
```

> **Note:** `useLink` returns the anchor props (href, target, rel). Check the Plate.js source if it returns `{ props }` or the props directly.

**Step 2: Commit**

```bash
git add apps/web/src/features/editor/plate/ui/link-element.tsx
git commit -m "feat(editor): add LinkElement component"
```

---

### Task 3: Create `link-floating-toolbar.tsx` — floating edit/open/unlink UI

**Files:**
- Create: `apps/web/src/features/editor/plate/ui/link-floating-toolbar.tsx`

**Step 1: Write the file**

```tsx
"use client";

import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@packages/ui/components/tooltip";
import {
  FloatingLink,
  LinkOpenButton,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
} from "@platejs/link/react";
import { ExternalLink, Link2Off, Pencil } from "lucide-react";

function LinkEditToolbar() {
  const state = useFloatingLinkEditState();
  const { props: inputProps, ref: inputRef } = useFloatingLinkEdit(state);

  return (
    <div className="flex items-center gap-1 p-1 rounded-md bg-popover border shadow-md">
      <Input
        ref={inputRef}
        className="h-7 text-xs w-48"
        placeholder="https://..."
        {...inputProps}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7">
            <LinkOpenButton>
              <ExternalLink className="size-3.5" />
            </LinkOpenButton>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Abrir link</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={state.unlink}
          >
            <Link2Off className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Remover link</TooltipContent>
      </Tooltip>
    </div>
  );
}

function LinkInsertToolbar() {
  const state = useFloatingLinkInsertState();
  const { props: inputProps, ref: inputRef } = useFloatingLinkInsert(state);

  return (
    <div className="flex items-center gap-1 p-1 rounded-md bg-popover border shadow-md">
      <Input
        ref={inputRef}
        className="h-7 text-xs w-48"
        placeholder="https:// ou /slug-interno"
        {...inputProps}
      />
    </div>
  );
}

export function LinkFloatingToolbar() {
  return (
    <FloatingLink>
      <LinkEditToolbar />
      <LinkInsertToolbar />
    </FloatingLink>
  );
}
```

> **Note:** Verify `FloatingLink`, `useFloatingLinkEdit`, `useFloatingLinkEditState`, `useFloatingLinkInsert`, `useFloatingLinkInsertState`, `LinkOpenButton` export names from `@platejs/link/react`. Plate.js v52 ships these hooks — check docs if names differ.

**Step 2: Commit**

```bash
git add apps/web/src/features/editor/plate/ui/link-floating-toolbar.tsx
git commit -m "feat(editor): add LinkFloatingToolbar component"
```

---

### Task 4: Wire `LinkKit` into `plate-editor.tsx`

**Files:**
- Modify: `apps/web/src/features/editor/plate/plate-editor.tsx`

**Step 1: Replace `LinkPlugin` import with `LinkKit`**

Remove:
```tsx
import { LinkPlugin } from "@platejs/link/react";
```

Add:
```tsx
import { LinkKit } from "./plugins/link-kit";
```

**Step 2: Update `usePlateEditor` plugins array**

Replace:
```tsx
plugins: [
  BasicBlocksPlugin,
  BasicMarksPlugin,
  LinkPlugin,           // ← remove this
  ...AIKit,
```

With:
```tsx
plugins: [
  BasicBlocksPlugin,
  BasicMarksPlugin,
  ...LinkKit,           // ← new
  ...AIKit,
```

**Step 3: Run the dev server to verify no TypeScript errors**

```bash
bun run typecheck
```

Expected: zero errors related to link imports.

**Step 4: Commit**

```bash
git add apps/web/src/features/editor/plate/plate-editor.tsx
git commit -m "feat(editor): wire LinkKit into PlateEditor (replaces bare LinkPlugin)"
```

---

## Phase 2 — Internal Links Sidebar

### Task 5: Add `getSuggestions` to `related-content.ts`

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/related-content.ts`

**Step 1: Add the `getSuggestions` handler at the end of the file**

```typescript
/**
 * Get internal link suggestions for a content item.
 * - If the content is a cluster pillar → returns its satellites.
 * - If the content is a satellite → returns the pillar and all sibling satellites.
 * - Excludes the content itself from results.
 */
export const getSuggestions = protectedProcedure
  .input(z.object({ contentId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const { db, organizationId } = context;

    const current = await getContentById(db, input.contentId);
    if (!current || current.organizationId !== organizationId) {
      throw new ORPCError("NOT_FOUND", { message: "Content not found." });
    }

    // Check if this content is a pillar (has satellites)
    const asPillar = await getRelatedContentBySourceId(db, input.contentId);

    if (asPillar.length > 0) {
      // It's a pillar — suggest all satellites
      return {
        role: "pillar" as const,
        suggestions: asPillar.map((r) => ({
          id: r.targetContentId,
          title: r.targetContent?.meta?.title ?? "Untitled",
          slug: r.targetContent?.meta?.slug ?? "",
          status: r.targetContent?.status ?? "draft",
          url: `/conteudo/${r.targetContent?.meta?.slug ?? r.targetContentId}`,
        })),
      };
    }

    // Check if this content is a satellite (appears as target in some pillar)
    const { relatedContent: relatedContentSchema } = await import(
      "@packages/database/schemas/related-content"
    );
    const { eq } = await import("drizzle-orm");

    const asSatellite = await db.query.relatedContent.findMany({
      where: eq(relatedContentSchema.targetContentId, input.contentId),
      with: {
        sourceContent: true,
      },
    });

    if (asSatellite.length > 0) {
      // It's a satellite — suggest the pillar and all sibling satellites
      const pillarId = asSatellite[0]!.sourceContentId;
      const siblings = await getRelatedContentBySourceId(db, pillarId);
      const pillar = asSatellite[0]!.sourceContent;

      const suggestions = [
        // Include the pillar itself
        ...(pillar
          ? [
              {
                id: pillarId,
                title: pillar.meta?.title ?? "Untitled",
                slug: pillar.meta?.slug ?? "",
                status: pillar.status ?? "draft",
                url: `/conteudo/${pillar.meta?.slug ?? pillarId}`,
              },
            ]
          : []),
        // Include sibling satellites (exclude self)
        ...siblings
          .filter((r) => r.targetContentId !== input.contentId)
          .map((r) => ({
            id: r.targetContentId,
            title: r.targetContent?.meta?.title ?? "Untitled",
            slug: r.targetContent?.meta?.slug ?? "",
            status: r.targetContent?.status ?? "draft",
            url: `/conteudo/${r.targetContent?.meta?.slug ?? r.targetContentId}`,
          })),
      ];

      return { role: "satellite" as const, suggestions };
    }

    // Not in any cluster — no suggestions
    return { role: "standalone" as const, suggestions: [] };
  });
```

> **Note:** The dynamic imports (`import(...)`) in the handler should be replaced with static imports at the top of the file. Move `import { relatedContent as relatedContentSchema } from "@packages/database/schemas/related-content"` and `import { eq } from "drizzle-orm"` to the top of `related-content.ts`.

**Corrected static imports to add at top of file:**
```typescript
import { eq } from "drizzle-orm";
import { relatedContent as relatedContentSchema } from "@packages/database/schemas/related-content";
```

Replace the dynamic imports in the handler body with direct references to the imported names.

**Step 2: Register `getSuggestions` in the router index**

Open `apps/web/src/integrations/orpc/router/index.ts` and verify `relatedContentRouter` already exports all procedures (it uses `* as relatedContentRouter`). Since the new export is in the same file, it will be automatically included. No change needed.

**Step 3: Typecheck**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add apps/web/src/integrations/orpc/router/related-content.ts
git commit -m "feat(editor): add getSuggestions procedure to related-content router"
```

---

### Task 6: Create `use-content-search.ts` hook

**Files:**
- Create: `apps/web/src/features/editor/plate/hooks/use-content-search.ts`

**Step 1: Write the file**

```typescript
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

interface ContentSearchResult {
  id: string;
  title: string;
  slug: string;
  url: string;
  status: string;
}

/**
 * Debounced search for content within the active team.
 * Used in LinkInput for "/" prefix content search.
 */
export function useContentSearch(query: string): {
  results: ContentSearchResult[];
  isLoading: boolean;
} {
  const trimmed = query.trim();

  const { data, isLoading } = useQuery(
    orpc.content.listAllContent.queryOptions({
      input: { limit: 10, status: ["draft", "published"] },
      enabled: trimmed.startsWith("/") && trimmed.length > 1,
      staleTime: 30_000,
    }),
  );

  if (!trimmed.startsWith("/") || trimmed.length <= 1) {
    return { results: [], isLoading: false };
  }

  // Filter client-side by the slug fragment after "/"
  const fragment = trimmed.slice(1).toLowerCase();
  const results: ContentSearchResult[] = (data?.items ?? [])
    .filter(
      (c) =>
        c.meta?.slug?.toLowerCase().includes(fragment) ||
        c.meta?.title?.toLowerCase().includes(fragment),
    )
    .map((c) => ({
      id: c.id,
      title: c.meta?.title ?? "Untitled",
      slug: c.meta?.slug ?? "",
      url: `/conteudo/${c.meta?.slug ?? c.id}`,
      status: c.status,
    }));

  return { results, isLoading };
}
```

> **Note:** `orpc.content.listAllContent` requires an active team — this is scoped by `protectedProcedure` context which includes `teamId`. No explicit teamId needed from caller.

**Step 2: Commit**

```bash
git add apps/web/src/features/editor/plate/hooks/use-content-search.ts
git commit -m "feat(editor): add useContentSearch hook for internal link search"
```

---

### Task 7: Create `InternalLinksSidebar`

**Files:**
- Create: `apps/web/src/features/editor/plate/ui/internal-links-sidebar.tsx`

**Step 1: Write the file**

```tsx
"use client";

import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import { Separator } from "@packages/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, Link2 } from "lucide-react";
import { useEditorRef } from "platejs/react";
import { Suspense } from "react";
import { orpc } from "@/integrations/orpc/client";

interface InternalLinksSidebarProps {
  contentId: string;
}

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "published") return "default";
  if (status === "draft") return "secondary";
  return "outline";
}

function SuggestionsList({ contentId }: { contentId: string }) {
  const editor = useEditorRef();

  const { data } = useSuspenseQuery(
    orpc.relatedContent.getSuggestions.queryOptions({
      input: { contentId },
    }),
  );

  if (data.suggestions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6 px-3">
        Este conteúdo não pertence a nenhum cluster ainda.
      </p>
    );
  }

  function handleInsertLink(url: string, title: string) {
    // If there's a selection, wrap it in a link; otherwise insert link text
    const selection = editor.selection;
    if (selection) {
      editor.tf.link.insert(url, { text: title });
    } else {
      editor.tf.insertText(title);
      // After inserting, immediately wrap in a link
      // (user can also drag/select and use Ctrl+K)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {data.suggestions.map((post) => (
        <div
          key={post.id}
          className={cn(
            "flex items-start justify-between gap-2 rounded-md p-2",
            "hover:bg-muted/50 transition-colors group",
          )}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs font-medium leading-tight line-clamp-2">
              {post.title}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge
                variant={statusBadgeVariant(post.status)}
                className="h-4 text-[10px] px-1"
              >
                {post.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                {post.slug}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => handleInsertLink(post.url, post.title)}
                >
                  <Link2 className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                Inserir link na seleção
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <a href={post.url} target="_blank" rel="noreferrer">
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <ExternalLink className="size-3" />
                  </Button>
                </a>
              </TooltipTrigger>
              <TooltipContent side="left">Abrir post</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InternalLinksSidebar({ contentId }: InternalLinksSidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-l bg-background flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Links do Cluster
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Clique em{" "}
          <Link2 className="inline size-2.5 mb-px" /> para inserir no cursor
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          <Suspense
            fallback={
              <div className="text-xs text-muted-foreground text-center py-4">
                Carregando...
              </div>
            }
          >
            <SuggestionsList contentId={contentId} />
          </Suspense>
        </div>
      </ScrollArea>
    </aside>
  );
}
```

> **Note:** `editor.tf.link.insert(url, { text })` — verify this API against `@platejs/link` v52. The actual API may be `editor.tf.link.insertLink({ url, text })` or require using Slate transforms directly. Check Plate source at `packages/link/src/transforms/`.

**Step 2: Commit**

```bash
git add apps/web/src/features/editor/plate/ui/internal-links-sidebar.tsx
git commit -m "feat(editor): add InternalLinksSidebar component"
```

---

## Phase 3 — Editor Layout Redesign

### Task 8: Create `FrontmatterSection`

**Files:**
- Create: `apps/web/src/features/editor/ui/frontmatter-section.tsx`

**Step 1: Write the file**

```tsx
"use client";

import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { Badge } from "@packages/ui/components/badge";
import { X } from "lucide-react";
import { useState, useCallback, KeyboardEvent } from "react";
import type { ContentMeta } from "@packages/database/schemas/content";

interface FrontmatterSectionProps {
  meta: ContentMeta;
  onChange: (meta: ContentMeta) => void;
  readOnly?: boolean;
}

export function FrontmatterSection({
  meta,
  onChange,
  readOnly = false,
}: FrontmatterSectionProps) {
  const [keywordInput, setKeywordInput] = useState("");

  const handleChange = useCallback(
    (field: keyof ContentMeta, value: string | string[]) => {
      onChange({ ...meta, [field]: value });
    },
    [meta, onChange],
  );

  const handleAddKeyword = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const kw = keywordInput.trim();
        if (kw && !meta.keywords?.includes(kw)) {
          handleChange("keywords", [...(meta.keywords ?? []), kw]);
        }
        setKeywordInput("");
      }
    },
    [keywordInput, meta.keywords, handleChange],
  );

  const handleRemoveKeyword = useCallback(
    (kw: string) => {
      handleChange("keywords", (meta.keywords ?? []).filter((k) => k !== kw));
    },
    [meta.keywords, handleChange],
  );

  return (
    <div className="border-b bg-muted/30 px-6 py-4 space-y-3">
      {/* Title */}
      <div>
        <Input
          className="text-2xl font-bold border-0 bg-transparent px-0 h-auto text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Título do post"
          value={meta.title ?? ""}
          onChange={(e) => handleChange("title", e.target.value)}
          readOnly={readOnly}
        />
      </div>

      {/* Description */}
      <div>
        <Input
          className="border-0 bg-transparent px-0 h-auto text-sm text-muted-foreground placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Meta description…"
          value={meta.description ?? ""}
          onChange={(e) => handleChange("description", e.target.value)}
          readOnly={readOnly}
        />
      </div>

      {/* Slug + Keywords row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs text-muted-foreground shrink-0">/conteudo/</span>
          <Input
            className="border-0 bg-transparent px-0 h-auto text-xs text-muted-foreground placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 w-32"
            placeholder="meu-slug"
            value={meta.slug ?? ""}
            onChange={(e) => handleChange("slug", e.target.value)}
            readOnly={readOnly}
          />
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1 flex-wrap">
          {(meta.keywords ?? []).map((kw) => (
            <Badge key={kw} variant="secondary" className="h-5 text-[10px] gap-1 pl-1.5 pr-1">
              {kw}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="hover:text-destructive"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </Badge>
          ))}
          {!readOnly && (
            <Input
              className="border-0 bg-transparent px-0 h-auto text-xs text-muted-foreground placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 w-24"
              placeholder="+ keyword"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleAddKeyword}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/editor/ui/frontmatter-section.tsx
git commit -m "feat(editor): add FrontmatterSection component for editing content meta"
```

---

### Task 9: Create `EditorFixedToolbar`

**Files:**
- Create: `apps/web/src/features/editor/ui/editor-fixed-toolbar.tsx`

This component renders **inside `<Plate>`** context so it can use `useEditorRef()`.

**Step 1: Write the file**

```tsx
"use client";

import { Button } from "@packages/ui/components/button";
import { Separator } from "@packages/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useMarkToolbarButton } from "@platejs/basic-nodes/react";
import { MARK_BOLD, MARK_ITALIC, MARK_UNDERLINE } from "@platejs/basic-nodes";
import { useEditorRef } from "platejs/react";
import {
  ArrowLeft,
  Bold,
  Italic,
  Link2,
  Loader2,
  Save,
  Underline,
} from "lucide-react";
import { cn } from "@packages/ui/lib/utils";

interface EditorFixedToolbarProps {
  title?: string;
  status?: string;
  isSaving?: boolean;
  onSave?: () => void;
  onBack?: () => void;
}

function MarkButton({
  nodeType,
  icon,
  tooltip,
  shortcut,
}: {
  nodeType: string;
  icon: React.ReactNode;
  tooltip: string;
  shortcut: string;
}) {
  const { props } = useMarkToolbarButton({ nodeType });
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", props.pressed && "bg-accent")}
          {...props}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {tooltip} <kbd className="text-[10px] opacity-60">{shortcut}</kbd>
      </TooltipContent>
    </Tooltip>
  );
}

function LinkButton() {
  const editor = useEditorRef();

  const handleLinkInsert = () => {
    // Trigger the floating link input (same as Ctrl+K default)
    // LinkPlugin handles Ctrl+K natively — this button programmatically triggers it
    editor.tf.link.triggerFloating();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleLinkInsert}
        >
          <Link2 className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Inserir link <kbd className="text-[10px] opacity-60">Ctrl+K</kbd>
      </TooltipContent>
    </Tooltip>
  );
}

export function EditorFixedToolbar({
  title,
  status,
  isSaving,
  onSave,
  onBack,
}: EditorFixedToolbarProps) {
  return (
    <div className="flex items-center h-12 px-3 border-b bg-background shrink-0 gap-2">
      {/* Left: back + title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {onBack && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onBack}>
                <ArrowLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voltar</TooltipContent>
          </Tooltip>
        )}
        <span className="text-sm font-medium truncate text-foreground">
          {title ?? "Sem título"}
        </span>
        {status && (
          <span className="text-xs text-muted-foreground capitalize shrink-0">
            {status}
          </span>
        )}
      </div>

      {/* Center: formatting buttons */}
      <div className="flex items-center gap-0.5">
        <MarkButton
          nodeType={MARK_BOLD}
          icon={<Bold className="size-3.5" />}
          tooltip="Negrito"
          shortcut="Ctrl+B"
        />
        <MarkButton
          nodeType={MARK_ITALIC}
          icon={<Italic className="size-3.5" />}
          tooltip="Itálico"
          shortcut="Ctrl+I"
        />
        <MarkButton
          nodeType={MARK_UNDERLINE}
          icon={<Underline className="size-3.5" />}
          tooltip="Sublinhado"
          shortcut="Ctrl+U"
        />
        <Separator orientation="vertical" className="h-4 mx-1" />
        <LinkButton />
      </div>

      {/* Right: save */}
      <div className="flex items-center gap-2 shrink-0">
        {onSave && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="default"
                className="h-7 px-3 gap-1.5"
                disabled={isSaving}
                onClick={onSave}
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span className="text-xs">Salvar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Salvar <kbd className="text-[10px] opacity-60">Ctrl+S</kbd>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
```

> **Note:** `useMarkToolbarButton` — verify import path from `@platejs/basic-nodes/react`. Also verify `MARK_BOLD`, `MARK_ITALIC`, `MARK_UNDERLINE` constants — they may be strings like `"bold"`, `"italic"`, `"underline"`. Check `@platejs/basic-nodes` exports.
>
> `editor.tf.link.triggerFloating()` — verify this is the correct method to programmatically open the floating link input. Check `@platejs/link` source.

**Step 2: Commit**

```bash
git add apps/web/src/features/editor/ui/editor-fixed-toolbar.tsx
git commit -m "feat(editor): add EditorFixedToolbar with icon buttons and tooltips"
```

---

### Task 10: Refactor `PlateEditor` to integrate toolbar, frontmatter, and sidebar

**Files:**
- Modify: `apps/web/src/features/editor/plate/plate-editor.tsx`

**Step 1: Add new props to `PlateEditorProps`**

```tsx
import type { ContentMeta } from "@packages/database/schemas/content";

export interface PlateEditorProps {
  initialValue?: Value;
  onChange?: (value: Value) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  contentId?: string;
  writerId?: string;
  model?: string;
  language?: string;
  teamId?: string;
  // NEW: frontmatter props
  meta?: ContentMeta;
  onMetaChange?: (meta: ContentMeta) => void;
  // NEW: toolbar props
  title?: string;
  status?: string;
  isSaving?: boolean;
  onSave?: () => void;
  onBack?: () => void;
  // NEW: sidebar toggle
  showLinksSidebar?: boolean;
}
```

**Step 2: Update the return JSX**

Replace the current JSX in `PlateEditor` with:

```tsx
return (
  <UploadFileProvider value={uploadFile}>
    <Plate
      editor={editor}
      onValueChange={onChange ? ({ value }) => onChange(value) : undefined}
      readOnly={!editable}
    >
      <EditorDiscussionSync contentId={contentId} />

      {/* Fixed toolbar — INSIDE <Plate> so useEditorRef() works */}
      <EditorFixedToolbar
        title={title}
        status={status}
        isSaving={isSaving}
        onSave={onSave}
        onBack={onBack}
      />

      {/* Frontmatter section */}
      {meta && onMetaChange && (
        <FrontmatterSection
          meta={meta}
          onChange={onMetaChange}
          readOnly={!editable}
        />
      )}

      {/* Content + Sidebar row */}
      <div className="flex flex-1 h-full overflow-hidden">
        <div className="flex-1 overflow-auto">
          <PlateContent
            className={cn(
              "min-h-[calc(100vh-8rem)] max-w-3xl mx-auto px-6 py-8",
              "text-sm ring-offset-background focus-visible:outline-none",
              "prose prose-sm max-w-none dark:prose-invert",
              "[&_h1]:text-3xl [&_h1]:font-bold",
              "[&_h2]:text-2xl [&_h2]:font-semibold",
              "[&_h3]:text-xl [&_h3]:font-medium",
              "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
              className,
            )}
            disableDefaultStyles
            placeholder={placeholder}
          />
        </div>

        {showLinksSidebar && contentId && (
          <InternalLinksSidebar contentId={contentId} />
        )}
      </div>
    </Plate>
  </UploadFileProvider>
);
```

**Step 3: Add imports at top of file**

```tsx
import type { ContentMeta } from "@packages/database/schemas/content";
import { EditorFixedToolbar } from "../ui/editor-fixed-toolbar";
import { FrontmatterSection } from "../ui/frontmatter-section";
import { InternalLinksSidebar } from "./ui/internal-links-sidebar";
```

> **Note:** `InternalLinksSidebar` uses `useSuspenseQuery` — it renders inside `<Plate>` which is already inside a `<Suspense>` boundary at the route level. No extra Suspense wrapper needed here.

**Step 4: Typecheck**

```bash
bun run typecheck
```

**Step 5: Commit**

```bash
git add apps/web/src/features/editor/plate/plate-editor.tsx
git commit -m "feat(editor): integrate toolbar, frontmatter, and links sidebar into PlateEditor"
```

---

### Task 11: Update `EditorPage` to pass new props and handle body loading/saving

**Files:**
- Modify: `apps/web/src/features/editor/ui/editor-page.tsx`

**Step 1: Rewrite `EditorPage`**

The page now:
1. Parses `content.body` (markdown) → Plate `Value` on mount
2. Captures editor value changes
3. On save: serializes Plate value → markdown AND saves meta (title/description/slug/keywords)
4. Removes the old custom header (now handled by `EditorFixedToolbar` inside `PlateEditor`)

```tsx
"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import type { Value } from "platejs";
import { orpc } from "@/integrations/orpc/client";
import { PlateEditor } from "../plate/plate-editor";
import type { ContentMeta } from "@packages/database/schemas/content";

interface EditorPageProps {
  contentId: string;
}

export function EditorPage({ contentId }: EditorPageProps) {
  const params = useParams({ strict: false }) as {
    slug: string;
    teamSlug: string;
  };
  const navigate = useNavigate();

  const { data: content } = useSuspenseQuery(
    orpc.content.getById.queryOptions({ input: { id: contentId } }),
  );

  const [meta, setMeta] = useState<ContentMeta>(
    content.meta ?? { title: "", description: "", slug: "" },
  );

  // Track current editor value for saving
  const editorValueRef = useRef<Value | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const updateMutation = useMutation(orpc.content.update.mutationOptions({}));

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Import serializer lazily to avoid bundle issues
      // (MarkdownKit is already in the editor's plugin chain via AIKit)
      await updateMutation.mutateAsync({
        id: contentId,
        data: { meta },
      });
    } finally {
      setIsSaving(false);
    }
  }, [contentId, meta, updateMutation]);

  const handleBack = useCallback(() => {
    navigate({ to: `/${params.slug}/${params.teamSlug}/content` });
  }, [navigate, params.slug, params.teamSlug]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <PlateEditor
        contentId={contentId}
        editable={content.status !== "archived"}
        key={contentId}
        writerId={content.writerId ?? undefined}
        meta={meta}
        onMetaChange={setMeta}
        title={meta.title || "Sem título"}
        status={content.status}
        isSaving={isSaving}
        onSave={handleSave}
        onBack={handleBack}
        showLinksSidebar
        onChange={(value) => {
          editorValueRef.current = value;
        }}
      />
    </div>
  );
}
```

> **Note:** `content.update` — check what the `data` input accepts in the update procedure. It should accept `meta` updates. If the procedure only accepts specific fields, verify in `apps/web/src/integrations/orpc/router/content.ts`.
>
> Body serialization (Plate Value → markdown) is deferred for a follow-up: the editor currently does not load `initialValue` from `content.body`. To fully enable body persistence, add `initialValue` parsing from markdown and pass the serialized markdown in the save call. See Plate.js `@platejs/markdown` docs.

**Step 2: Remove the old `EditorLayout` from editor-page imports**

The `EditorLayout` wrapper is no longer needed in `EditorPage` (layout is now handled inside `PlateEditor`). It can still exist for other uses.

**Step 3: Typecheck**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add apps/web/src/features/editor/ui/editor-page.tsx
git commit -m "feat(editor): update EditorPage to use new PlateEditor layout API"
```

---

## Phase 4 — Agent Tools Update

### Task 12: Update `add-internal-links-tool.ts` to use clean inline links

**Files:**
- Modify: `packages/agents/src/mastra/tools/editor/add-internal-links-tool.ts`

**Current behavior:** Inserts `> **Leia também:** [title](/blog/slug)` blockquotes before headings.

**New behavior:** Inserts inline hyperlinks `[title](/conteudo/slug)` directly within paragraph text (after the first sentence of a section), which is more SEO-friendly and less intrusive.

Also fix the URL prefix: use `/conteudo/` instead of `/blog/`.

**Step 1: Replace the `execute` function**

```typescript
execute: async (input) => {
  const { content, relatedPosts, maxLinks } = input;

  if (!relatedPosts || relatedPosts.length === 0) {
    return {
      success: false,
      modifiedContent: content,
      linksAdded: [],
      message: "No related posts provided. Run searchPreviousContent first.",
    };
  }

  let modifiedContent = content;
  const linksAdded: Array<{ title: string; slug: string; insertedAt: string }> = [];

  // Find paragraphs (lines of prose text, not headings/blockquotes/lists)
  const paragraphPattern = /^(?!#|>|-|\*|\d+\.)(.{80,})/gm;
  const paragraphs: Array<{ text: string; index: number }> = [];
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: pattern requires assignment in condition
  while ((match = paragraphPattern.exec(modifiedContent)) !== null) {
    paragraphs.push({ text: match[0], index: match.index });
  }

  const postsToInsert = relatedPosts.slice(0, maxLinks);

  for (let i = 0; i < postsToInsert.length; i++) {
    const post = postsToInsert[i];
    if (!post) continue;

    const paragraph = paragraphs[i * 2]; // Space out links across different paragraphs
    if (!paragraph) {
      // Fallback: append before conclusion or at end
      const conclusionMatch = modifiedContent.match(
        /^## (?:Conclusão|Resumo|Considerações|Conclusion|Summary)/m,
      );
      const insertText = `\n[${post.title}](/conteudo/${post.slug})\n\n`;
      if (conclusionMatch) {
        const insertPoint = modifiedContent.indexOf(conclusionMatch[0]);
        modifiedContent =
          modifiedContent.slice(0, insertPoint) +
          insertText +
          modifiedContent.slice(insertPoint);
        linksAdded.push({ title: post.title, slug: post.slug, insertedAt: "before conclusion" });
      } else {
        modifiedContent += insertText;
        linksAdded.push({ title: post.title, slug: post.slug, insertedAt: "end of content" });
      }
      continue;
    }

    // Find a good insertion point: after a sentence (". ") in the paragraph
    const sentenceEnd = paragraph.text.indexOf(". ");
    if (sentenceEnd > 20) {
      const insertOffset = paragraph.index + sentenceEnd + 2;
      const anchor = `[${post.title}](/conteudo/${post.slug})`;
      modifiedContent =
        modifiedContent.slice(0, insertOffset) +
        anchor +
        " " +
        modifiedContent.slice(insertOffset);
      linksAdded.push({
        title: post.title,
        slug: post.slug,
        insertedAt: `inline in paragraph ${i + 1}`,
      });
    }
  }

  return {
    success: linksAdded.length > 0,
    modifiedContent,
    linksAdded,
    message:
      linksAdded.length > 0
        ? `Added ${linksAdded.length} internal links inline`
        : "No suitable insertion points found",
  };
},
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add packages/agents/src/mastra/tools/editor/add-internal-links-tool.ts
git commit -m "feat(agents): update addInternalLinks to use inline links with /conteudo/ prefix"
```

---

## Verification Checklist

After all tasks are complete, verify the following:

- [ ] `Ctrl+K` in the editor opens the floating link input
- [ ] Pasting a URL over selected text creates a link automatically
- [ ] Clicking a link in the editor shows the floating toolbar (edit URL, open, unlink)
- [ ] Internal URLs starting with `/` are accepted as valid in the link input
- [ ] The frontmatter section (title, description, slug, keywords) is editable above the content
- [ ] The fixed toolbar shows bold/italic/underline/link buttons with tooltips
- [ ] Clicking Save calls the update mutation and shows the loading spinner
- [ ] The internal links sidebar appears on the right when `showLinksSidebar={true}`
- [ ] The sidebar shows cluster-related posts for content that belongs to a cluster
- [ ] Clicking the link icon in the sidebar inserts the link at the cursor position
- [ ] `bun run typecheck` passes with zero errors
- [ ] `bun run check` (Biome) passes with zero lint errors

---

## Notes and Known Deferred Items

1. **Body loading/saving:** `content.body` is not yet loaded as `initialValue` in `PlateEditor`. Full markdown ↔ Plate Value serialization via `@platejs/markdown` is a follow-up task. For now, the editor starts empty.

2. **Link input `/` search:** The spec calls for a search dropdown in the link input when typing `/`. This requires a custom `LinkInput` component that replaces the default Plate input. This is a UX enhancement to implement after the basic link toolbar is working. Use `useContentSearch` hook (Task 6) and render a `Popover` with search results.

3. **`add-external-links-tool.ts`:** No changes needed — the tool returns suggestions only (no automatic insertion), which is already correct behavior.

4. **Keyboard shortcut for save:** Add `Ctrl+S` keyboard shortcut to save in `EditorFixedToolbar` or `EditorPage` using a `useEffect` with a `keydown` listener.
