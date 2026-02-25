# Context Panel Revision Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Revise the context panel to use a proper shadcn `Sidebar side="right" variant="inset"` (matching the existing `SidebarSubPanel` pattern), move the two trigger buttons (AI + panel) into `PageHeader.actions` via a reusable `ContextPanelHeaderActions` component, and remove the toggle button from the TabBar.

**Architecture:** The context panel follows the same pattern as `SidebarSubPanel`: a `SidebarProvider className="min-h-0"` wrapping a `Sidebar side="right" variant="inset" collapsible="offcanvas"`, placed inside `SidebarInset` in `DashboardLayout`. The store (`contextPanelStore`) remains the single source of truth for open/close state, wired to `SidebarProvider` via `open` + `onOpenChange`. The panel renders as a `fixed right-0 inset-y-0` overlay whose tab-icons header aligns vertically with the TabBar — exactly like PostHog.

**Tech Stack:** `@packages/ui/components/sidebar` (Sidebar, SidebarProvider, SidebarContent, SidebarHeader), `@tanstack/react-store`, Lucide icons, TanStack Router

---

## Critical Context

### Sidebar component behavior (read `packages/ui/src/components/sidebar.tsx`)
- `Sidebar side="right" variant="inset" collapsible="offcanvas"` renders:
  - A **gap div** (in flex flow, `w-0` when collapsed, `w-(--sidebar-width)` when expanded)
  - A **fixed panel** (`fixed inset-y-0 right-0`, slides in/out via `right-[calc(var(--sidebar-width)*-1)]` when collapsed)
  - `variant="inset"` adds `p-2` inside the fixed container → inner content gets rounded corners
- `SidebarProvider` renders `div[flex min-h-svh w-full]` — override with `className="min-h-0"` to collapse height
- `SidebarProvider` writes to `sidebar_state` cookie — harmless because our main sidebar uses `localStorage` (`contentta:sidebar-collapsed`), not the cookie
- `--sidebar-width` CSS variable defaults to 16rem; override with `style={{ "--sidebar-width": "20rem" }}` for 320px panel

### SidebarSubPanel pattern (the pattern to follow exactly)
```tsx
// sidebar-sub-panel.tsx
export function SidebarSubPanel() {
   return (
      <SidebarProvider className="min-h-0" defaultOpen={false}>
         <SidebarManager name="sub-panel">
            <SubPanelSidebar ... />
         </SidebarManager>
      </SidebarProvider>
   );
}
```
`GlobalContextPanel` must follow this same structure.

### PageHeader `actions` prop
`apps/web/src/components/page-header.tsx` already has:
```tsx
actions?: ReactNode;
// renders: <div className="flex items-center gap-2 shrink-0">{actions}</div>
```
`ContextPanelHeaderActions` is passed here by each page.

### Current state after previous implementation
- `context-panel-store.ts` ✓ — keep as-is
- `use-context-panel.ts` ✓ — keep as-is
- `context-panel.tsx` ← **REWRITE** — replace custom div with proper Sidebar
- `tab-bar.tsx` ← **REVERT** — remove PanelRight button
- `dashboard-layout.tsx` ← **REVERT partially** — remove flex row wrapper + GlobalContextPanel from it, add GlobalContextPanel inside SidebarInset near SidebarSubPanel

---

## Task 0: Make AppSidebar use variant="inset"

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/app-sidebar.tsx`

**Step 1: Read the file**

Read `apps/web/src/layout/dashboard/ui/app-sidebar.tsx`.

**Step 2: Add variant="inset" and remove border overrides**

The `<Sidebar>` currently has:
```tsx
<Sidebar
   className="border-r-0 group-data-[side=left]:border-r-0"
   collapsible="icon"
   {...props}
>
```

`variant="inset"` removes the border (adds `p-2` instead), so the border override classes are no longer needed. Change to:
```tsx
<Sidebar
   collapsible="icon"
   variant="inset"
   {...props}
>
```

**Step 3: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "error TS" | head -20
```

Expected: 0 errors.

---

## Task 1: Revert TabBar — remove PanelRight button

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/tab-bar.tsx`

**Step 1: Read the file**

Read `apps/web/src/layout/dashboard/ui/tab-bar.tsx` to see current state.

**Step 2: Remove all context-panel-related additions**

Remove:
- `import { PanelRight } from "lucide-react"` (keep `Plus` import)
- `import { cn } from "@packages/ui/lib/utils"` — check if `cn` was already there before or added by prev task. If added by prev task, remove it. If it was there before, keep it.
- `import { toggleContextPanel, useContextPanel } from "@/features/context-panel/use-context-panel"` — remove entirely
- `const { isOpen: isPanelOpen } = useContextPanel();` — remove
- The entire `{/* Context panel toggle */}` div block at the end of the return JSX

**Step 3: Verify typecheck**

```bash
bun run typecheck 2>&1 | grep -E "error TS" | head -20
```

Expected: 0 errors.

---

## Task 2: Rewrite context-panel.tsx — proper shadcn Sidebar

**Files:**
- Modify: `apps/web/src/features/context-panel/context-panel.tsx`

**Step 1: Read current file to understand what to replace**

Read `apps/web/src/features/context-panel/context-panel.tsx`.

**Step 2: Write the new file**

Complete replacement. The key difference: wraps with `SidebarProvider` + uses `Sidebar side="right" variant="inset"` instead of a custom div. Chat tab stays built-in (not in store). `SidebarContent` replaces `ScrollArea`.

```tsx
"use client";

import { Button } from "@packages/ui/components/button";
import {
   Sidebar,
   SidebarContent,
   SidebarManager,
   SidebarProvider,
} from "@packages/ui/components/sidebar";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { useStore } from "@tanstack/react-store";
import { MessageSquare, X } from "lucide-react";
import type React from "react";
import { contextPanelStore, type ContextPanelTab } from "./context-panel-store";
import {
   closeContextPanel,
   openContextPanel,
   setActiveTab,
} from "./use-context-panel";

function ChatPlaceholder() {
   return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
         <MessageSquare className="size-8 text-muted-foreground/30" />
         <p className="text-sm text-muted-foreground/60 leading-relaxed">
            Chat IA contextual em breve.
         </p>
      </div>
   );
}

const CHAT_TAB: ContextPanelTab = {
   id: "chat",
   icon: MessageSquare,
   label: "Chat IA",
   content: <ChatPlaceholder />,
   order: 0,
};

function ContextPanelInner() {
   const { activeTabId, dynamicTabs } = useStore(contextPanelStore);

   const allTabs: ContextPanelTab[] = [
      CHAT_TAB,
      ...dynamicTabs.sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
   ];

   const activeTab = allTabs.find((t) => t.id === activeTabId) ?? allTabs[0];

   return (
      <Sidebar
         collapsible="offcanvas"
         side="right"
         variant="inset"
      >
         {/* Tab icons header — h-12 aligns vertically with TabBar */}
         <div className="flex h-12 shrink-0 items-center gap-0.5 border-b px-2">
            <TooltipProvider>
               {allTabs.map((tab) => (
                  <Tooltip key={tab.id}>
                     <TooltipTrigger asChild>
                        <Button
                           className={cn(
                              "size-7 rounded",
                              activeTabId === tab.id &&
                                 "bg-accent text-accent-foreground",
                           )}
                           onClick={() => setActiveTab(tab.id)}
                           size="icon"
                           type="button"
                           variant="ghost"
                        >
                           <tab.icon className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent side="bottom">{tab.label}</TooltipContent>
                  </Tooltip>
               ))}
               <div className="flex-1" />
               <Button
                  className="size-7 rounded text-muted-foreground"
                  onClick={closeContextPanel}
                  size="icon"
                  type="button"
                  variant="ghost"
               >
                  <X className="size-3.5" />
               </Button>
            </TooltipProvider>
         </div>

         {/* Active tab content */}
         <SidebarContent>{activeTab?.content}</SidebarContent>
      </Sidebar>
   );
}

export function GlobalContextPanel() {
   const { isOpen } = useStore(contextPanelStore);

   return (
      <SidebarProvider
         className="min-h-0"
         defaultOpen={false}
         onOpenChange={(open) =>
            open ? openContextPanel() : closeContextPanel()
         }
         open={isOpen}
         style={{ "--sidebar-width": "20rem" } as React.CSSProperties}
      >
         <SidebarManager name="context-panel">
            <ContextPanelInner />
         </SidebarManager>
      </SidebarProvider>
   );
}
```

**Step 3: Verify `SidebarManager` and `SidebarContent` are exported**

Check `packages/ui/src/components/sidebar.tsx` exports — they should be. Also check `packages/ui/package.json` exports for `./components/sidebar`.

**Step 4: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "error TS" | head -20
```

Expected: 0 errors.

---

## Task 3: Update DashboardLayout — move GlobalContextPanel inside SidebarInset

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`

**Step 1: Read current file**

Read `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`.

**Step 2: Revert the flex-row wrapper + restore simple main**

Find current structure (added in previous implementation):
```tsx
               <div className="flex flex-1 overflow-hidden">
                  <main
                     className={cn(
                        "relative flex-1 bg-background border-white/10 border-t-1",
                        isEditorPage
                           ? "overflow-hidden p-0"
                           : isSettingsPage
                             ? "overflow-hidden p-4"
                             : "overflow-y-auto p-4",
                     )}
                  >
                     {children}
                  </main>
                  <GlobalContextPanel />
               </div>
```

Replace with (move `GlobalContextPanel` OUT of the flex row, place it alongside `SidebarSubPanel`):
```tsx
               <GlobalContextPanel />
               <main
                  className={cn(
                     "relative flex-1 bg-background p-4 border-white/10 border-t-1",
                     isEditorPage
                        ? "overflow-hidden p-0"
                        : isSettingsPage
                          ? "overflow-hidden p-4"
                          : "overflow-y-auto p-4",
                  )}
               >
                  {children}
               </main>
```

> **Note:** `GlobalContextPanel` renders a `SidebarProvider div` with `min-h-0` — it takes zero height in the flex column. The `Sidebar` inside it is `fixed` positioned so it overlays content without affecting layout.

**Step 3: Also revert the duplicate `p-4` issue**

The original `<main>` had `p-4` hardcoded and then the `isSettingsPage` conditional added `overflow`. The new code should keep `isEditorPage` check (added in previous impl) but restore clean logic:

```tsx
<main
   className={cn(
      "relative flex-1 bg-background border-white/10 border-t-1",
      isEditorPage
         ? "overflow-hidden p-0"
         : isSettingsPage
           ? "overflow-hidden p-4"
           : "overflow-y-auto p-4",
   )}
>
   {children}
</main>
```

**Step 4: Verify full SidebarInset block looks like this**

```tsx
<SidebarInset className="flex flex-col overflow-hidden">
   <SidebarSubPanel />
   <GlobalContextPanel />
   <div className="shrink-0">
      <TabBar
         onNewTab={openNewSearchTab}
         onTabClose={handleCloseTab}
         onTabFocus={navigateToTab}
      />
   </div>
   <main
      className={cn(
         "relative flex-1 bg-background border-white/10 border-t-1",
         isEditorPage
            ? "overflow-hidden p-0"
            : isSettingsPage
              ? "overflow-hidden p-4"
              : "overflow-y-auto p-4",
      )}
   >
      {children}
   </main>
   <FeedbackFab />
</SidebarInset>
```

**Step 5: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "error TS" | head -20
```

Expected: 0 errors.

---

## Task 4: Create ContextPanelHeaderActions component

**Files:**
- Create: `apps/web/src/features/context-panel/context-panel-header-actions.tsx`

**Step 1: Write the file**

Two buttons: AI (Sparkles — opens panel with Chat tab) and Panel (PanelRight — toggles panel). Active state when panel is open. Consistent with the existing icon button styling used throughout the app.

```tsx
import { Button } from "@packages/ui/components/button";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { PanelRight, Sparkles } from "lucide-react";
import {
   openContextPanel,
   setActiveTab,
   toggleContextPanel,
   useContextPanel,
} from "./use-context-panel";

export function ContextPanelHeaderActions() {
   const { isOpen } = useContextPanel();

   const handleOpenAI = () => {
      setActiveTab("chat");
      openContextPanel();
   };

   return (
      <TooltipProvider>
         <div className="flex items-center gap-1">
            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className={cn(
                        "size-8 rounded",
                        isOpen && "bg-accent text-accent-foreground",
                     )}
                     onClick={handleOpenAI}
                     size="icon"
                     type="button"
                     variant="ghost"
                  >
                     <Sparkles className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>Abrir Chat IA</TooltipContent>
            </Tooltip>

            <Tooltip>
               <TooltipTrigger asChild>
                  <Button
                     className={cn(
                        "size-8 rounded",
                        isOpen && "bg-accent text-accent-foreground",
                     )}
                     onClick={toggleContextPanel}
                     size="icon"
                     type="button"
                     variant="ghost"
                  >
                     <PanelRight className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  {isOpen ? "Fechar painel" : "Abrir painel"}
               </TooltipContent>
            </Tooltip>
         </div>
      </TooltipProvider>
   );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "error TS" | head -20
```

Expected: 0 errors.

---

## Task 5: Integrate ContextPanelHeaderActions into at least one page header

This demonstrates the usage pattern and validates the component works end-to-end.

**Files:**
- Modify: one page that uses `PageHeader` — use the content list page as the example

**Step 1: Find a page that uses PageHeader**

```bash
grep -r "PageHeader" apps/web/src/routes --include="*.tsx" -l | head -5
```

Pick the first result. Read that file.

**Step 2: Add ContextPanelHeaderActions to its actions**

If the page already has `actions={<SomeButton />}`, wrap with fragment:
```tsx
import { ContextPanelHeaderActions } from "@/features/context-panel/context-panel-header-actions";

// In the PageHeader:
actions={
   <>
      {/* existing actions */}
      <ContextPanelHeaderActions />
   </>
}
```

If no actions prop, add:
```tsx
actions={<ContextPanelHeaderActions />}
```

**Step 3: Typecheck**

```bash
bun run typecheck 2>&1 | grep -E "error TS" | head -20
```

Expected: 0 errors.

---

## Task 6: Final typecheck + commit

**Step 1: Full typecheck**

```bash
bun run typecheck 2>&1
```

Fix any errors found.

**Step 2: Verify SidebarManager and Sidebar exports**

```bash
grep -n "export.*SidebarManager\|export.*SidebarContent\|export.*Sidebar[^P]" packages/ui/src/components/sidebar.tsx | head -10
```

And check package.json exports:
```bash
grep "sidebar" packages/ui/package.json
```

**Step 3: Commit**

```bash
git add apps/web/src/features/context-panel/ apps/web/src/layout/dashboard/ui/tab-bar.tsx apps/web/src/layout/dashboard/ui/dashboard-layout.tsx

git commit -m "$(cat <<'EOF'
refactor(ui): use shadcn Sidebar for context panel, move triggers to PageHeader

- Replace custom context panel div with Sidebar side="right" variant="inset"
  following the same SidebarProvider pattern as SidebarSubPanel
- GlobalContextPanel now uses SidebarProvider+SidebarManager+Sidebar as
  a fixed right overlay (inset variant) aligning with TabBar height
- Remove PanelRight toggle from TabBar
- Add ContextPanelHeaderActions component (Sparkles + PanelRight buttons)
  for use in PageHeader.actions across pages

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Implementation Notes

### Why SidebarProvider wraps GlobalContextPanel and not DashboardLayout
`SidebarSubPanel` (the reference pattern) wraps its own `SidebarProvider` internally. This keeps the context panel self-contained. `SidebarManager` registration lets the global `SidebarManagerProvider` (in `DashboardLayout`) track the panel's state if needed in the future.

### Why GlobalContextPanel renders zero height in the flex column
`SidebarProvider` renders `div[flex min-h-svh w-full]`. We override with `className="min-h-0"` → `tailwind-merge` resolves to `min-h-0`. The `div` has `h-0` and the `Sidebar` component renders `fixed` content that escapes flow. Zero layout impact on sibling elements.

### Why the panel header height is h-12
The TabBar is `h-12`. Making the panel's tab-icons row `h-12` means it visually aligns with the TabBar when the panel is open — the PostHog design pattern.

### Why variant="inset" not variant="sidebar"
`variant="inset"` adds `p-2` inside the fixed container → inner sidebar content has rounded corners (`rounded-xl` via `SidebarInset` peer styles, and the inner div gets `rounded-lg` from the inset variant). Gives the "floating panel" look the user wants.

### ContextPanelHeaderActions usage pattern
Any page that uses `PageHeader` can include `<ContextPanelHeaderActions />` in `actions`. It's intentionally NOT wired into `PageHeader` itself so pages can control placement (before/after their own action buttons).

### SidebarContent vs ScrollArea
`SidebarContent` from shadcn has `overflow-auto` built-in (`flex min-h-0 flex-1 flex-col gap-2 overflow-auto`). No need for a separate `ScrollArea` wrapper.
