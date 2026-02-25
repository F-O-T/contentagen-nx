# Context Panel Global Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a global Context Panel (right column, 320px) present in all screens with dynamic tab registration, and integrate the editor under DashboardLayout creating a unified 3-column layout.

**Architecture:** TanStack Store powers the panel state (`isOpen`, `activeTabId`, `dynamicTabs`). The panel renders built-in tabs (Chat) combined with feature-registered tabs (Settings, Links for editor). The editor route migrates from isolated `_editor` layout to `_dashboard` layout so it inherits AppSidebar + TabBar + Context Panel automatically.

**Tech Stack:** `@tanstack/react-store`, `platejs/react`, TanStack Router file-based routing, Radix Tooltip, Lucide icons

---

## Critical Context

### Current file locations
- Editor isolated layout: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_editor.tsx`
- Editor content route: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_editor/$contentId.tsx`
- Dashboard layout route: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard.tsx`
- Dashboard layout component: `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`
- TabBar: `apps/web/src/layout/dashboard/ui/tab-bar.tsx`
- Store pattern reference: `apps/web/src/hooks/use-sheet.tsx`, `use-credenza.tsx`
- EditorPage: `apps/web/src/features/editor/ui/editor-page.tsx`
- PlateEditor: `apps/web/src/features/editor/plate/plate-editor.tsx`
- FrontmatterSection: `apps/web/src/features/editor/ui/frontmatter-section.tsx`
- InternalLinksSidebar: `apps/web/src/features/editor/plate/ui/internal-links-sidebar.tsx`
- EditorFixedToolbar: `apps/web/src/features/editor/ui/editor-fixed-toolbar.tsx`

### Key constraints
- `_dashboard` and `_editor` are **pathless** layout routes in TanStack Router (prefixed with `_`), meaning they don't appear in the URL. Moving `$contentId.tsx` from `_editor/` to `_dashboard/` changes the layout parent but keeps the URL identical (`/:slug/:teamSlug/:contentId`).
- `EditorPage` already has `useParams({ from: "/_authenticated/$slug/$teamSlug/_dashboard" })` — stays valid after migration.
- `InternalLinksSidebar` uses `useParams({ from: "/_authenticated/$slug/$teamSlug/_editor/$contentId" })` — must change to `_dashboard`.
- `DashboardLayout`'s `<main>` has `p-4 overflow-y-auto`. Editor needs `p-0 overflow-hidden`.
- `DashboardLayout`'s `beforeLoad` in `_dashboard.tsx` checks onboarding status — editor will now also be protected by this, which is correct.

---

## Task 1: Create context-panel-store.ts

**Files:**
- Create: `apps/web/src/features/context-panel/context-panel-store.ts`

**Step 1: Write the store**

```typescript
import { Store } from "@tanstack/react-store";
import type React from "react";

export interface ContextPanelTab {
   id: string;
   icon: React.ElementType;
   label: string;
   content: React.ReactNode;
   order?: number;
}

interface ContextPanelState {
   isOpen: boolean;
   activeTabId: string;
   dynamicTabs: ContextPanelTab[];
}

export const contextPanelStore = new Store<ContextPanelState>({
   isOpen: false,
   activeTabId: "chat",
   dynamicTabs: [],
});
```

**Step 2: Verify file was created**

```bash
ls apps/web/src/features/context-panel/
```

Expected: `context-panel-store.ts`

---

## Task 2: Create use-context-panel.ts

**Files:**
- Create: `apps/web/src/features/context-panel/use-context-panel.ts`

**Step 1: Write the hook**

Follow `use-sheet.tsx` / `use-credenza.tsx` exactly — same style, same store mutation pattern.

```typescript
import { useStore } from "@tanstack/react-store";
import { contextPanelStore, type ContextPanelTab } from "./context-panel-store";

export const openContextPanel = () =>
   contextPanelStore.setState((s) => ({ ...s, isOpen: true }));

export const closeContextPanel = () =>
   contextPanelStore.setState((s) => ({ ...s, isOpen: false }));

export const toggleContextPanel = () =>
   contextPanelStore.setState((s) => ({ ...s, isOpen: !s.isOpen }));

export const setActiveTab = (id: string) =>
   contextPanelStore.setState((s) => ({ ...s, activeTabId: id }));

export const registerTab = (tab: ContextPanelTab) =>
   contextPanelStore.setState((s) => {
      const exists = s.dynamicTabs.some((t) => t.id === tab.id);
      const updated = exists
         ? s.dynamicTabs.map((t) => (t.id === tab.id ? tab : t))
         : [...s.dynamicTabs, tab];
      return { ...s, dynamicTabs: updated };
   });

export const unregisterTab = (id: string) =>
   contextPanelStore.setState((s) => {
      const remaining = s.dynamicTabs.filter((t) => t.id !== id);
      // If the removed tab was active, fall back to "chat"
      const activeTabId =
         s.activeTabId === id ? "chat" : s.activeTabId;
      return { ...s, dynamicTabs: remaining, activeTabId };
   });

export const useContextPanel = () => {
   const { isOpen, activeTabId, dynamicTabs } = useStore(contextPanelStore);
   return {
      isOpen,
      activeTabId,
      dynamicTabs,
      openContextPanel,
      closeContextPanel,
      toggleContextPanel,
      setActiveTab,
      registerTab,
      unregisterTab,
   };
};
```

---

## Task 3: Create GlobalContextPanel component

**Files:**
- Create: `apps/web/src/features/context-panel/context-panel.tsx`

**Step 1: Write the component**

The Chat tab is a built-in tab — hardcoded in this component, never registered via `registerTab`. Dynamic tabs from features are stored in `contextPanelStore.dynamicTabs`.

```tsx
"use client";

import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { MessageSquare, X } from "lucide-react";
import type React from "react";
import { useStore } from "@tanstack/react-store";
import {
   closeContextPanel,
   setActiveTab,
} from "./use-context-panel";
import { contextPanelStore, type ContextPanelTab } from "./context-panel-store";

// Built-in Chat tab — always present, never registered dynamically
const CHAT_TAB: ContextPanelTab = {
   id: "chat",
   icon: MessageSquare,
   label: "Chat IA",
   content: <ChatPlaceholder />,
   order: 0,
};

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

export function GlobalContextPanel() {
   const { isOpen, activeTabId, dynamicTabs } = useStore(contextPanelStore);

   // Combine built-in + dynamic tabs sorted by order
   const allTabs: ContextPanelTab[] = [
      CHAT_TAB,
      ...dynamicTabs.sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
   ];

   const activeTab = allTabs.find((t) => t.id === activeTabId) ?? allTabs[0];

   if (!isOpen) return null;

   return (
      <TooltipProvider>
         <div className="flex w-80 shrink-0 flex-col border-l bg-background">
            {/* Icon tab row */}
            <div className="flex h-10 shrink-0 items-center gap-0.5 border-b px-2">
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
            </div>

            {/* Active tab content */}
            <ScrollArea className="flex-1">
               {activeTab?.content}
            </ScrollArea>
         </div>
      </TooltipProvider>
   );
}
```

> **Note:** `ChatPlaceholder` is defined above `CHAT_TAB` so the JSX reference is valid. No hoisting issue since it's a function component.

---

## Task 4: Update DashboardLayout — 3-column layout + editor detection

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`

**Step 1: Import GlobalContextPanel**

Add import at top with other UI imports:
```typescript
import { GlobalContextPanel } from "@/features/context-panel/context-panel";
```

**Step 2: Add editor page detection**

After the existing `isSettingsPage` check (line 51), add:
```typescript
const isEditorPage = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
   pathname.split("/").at(-1) ?? "",
);
```

**Step 3: Restructure the SidebarInset content**

Find the block starting at line 149:
```tsx
<SidebarInset className="flex flex-col overflow-hidden">
   <SidebarSubPanel />
   <div className="shrink-0">
      <TabBar ... />
   </div>
   <main
      className={cn(
         "relative flex-1 bg-background p-4 border-white/10 border-t-1",
         isSettingsPage ? "overflow-hidden" : "overflow-y-auto",
      )}
   >
      {children}
   </main>
   <FeedbackFab />
</SidebarInset>
```

Replace with:
```tsx
<SidebarInset className="flex flex-col overflow-hidden">
   <SidebarSubPanel />
   <div className="shrink-0">
      <TabBar
         onNewTab={openNewSearchTab}
         onTabClose={handleCloseTab}
         onTabFocus={navigateToTab}
      />
   </div>
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
   <FeedbackFab />
</SidebarInset>
```

> `FeedbackFab` stays outside the `flex row` wrapper so it floats over the entire layout, not just the main column.

---

## Task 5: Update TabBar — add context panel toggle button

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/tab-bar.tsx`

**Step 1: Add imports**

Add at top:
```typescript
import { PanelRight } from "lucide-react";
import { toggleContextPanel, useContextPanel } from "@/features/context-panel/use-context-panel";
```

**Step 2: Read panel state in component**

Add inside the `TabBar` function, before the `if (!isHydrated)` check:
```typescript
const { isOpen: isPanelOpen } = useContextPanel();
```

**Step 3: Add toggle button at right side of TabBar**

The current `return` has one outer `<div className="flex h-12 shrink-0 items-center bg-sidebar">` with one child (the scrollable area). Add a second child after the scrollable div:

Find:
```tsx
   return (
      <div className="flex h-12 shrink-0 items-center bg-sidebar">
         {/* Scrollable tab area */}
         <div
            className="flex min-w-0 flex-1 items-stretch overflow-x-auto scrollbar-none"
            ref={scrollRef}
         >
            ...
         </div>
      </div>
   );
```

Replace with:
```tsx
   return (
      <div className="flex h-12 shrink-0 items-center bg-sidebar">
         {/* Scrollable tab area */}
         <div
            className="flex min-w-0 flex-1 items-stretch overflow-x-auto scrollbar-none"
            ref={scrollRef}
         >
            {tabs.map((tab) => (
               <div data-tab-id={tab.id} key={tab.id}>
                  <TabItem
                     icon={tab.icon}
                     id={tab.id}
                     isActive={tab.id === activeTabId}
                     isDirty={tab.isDirty}
                     isPinned={tab.isPinned}
                     label={tab.label}
                     onClose={handleClose}
                     onCloseAll={handleCloseAll}
                     onCloseOthers={handleCloseOthers}
                     onFocus={handleFocus}
                     onPin={handlePin}
                     onUnpin={handleUnpin}
                     type={tab.type}
                  />
               </div>
            ))}

            {/* New tab button - directly after tabs */}
            <Button
               className="h-9 w-9 ml-1 shrink-0 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
               onClick={onNewTab}
               size="icon"
               title="Nova aba"
               type="button"
               variant="ghost"
            >
               <Plus className="size-4" />
            </Button>
         </div>

         {/* Context panel toggle */}
         <div className="flex shrink-0 items-center px-1 border-l border-border/30 ml-1">
            <Button
               className={cn(
                  "size-8 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  isPanelOpen && "bg-sidebar-accent text-foreground",
               )}
               onClick={toggleContextPanel}
               size="icon"
               title="Painel de contexto"
               type="button"
               variant="ghost"
            >
               <PanelRight className="size-4" />
            </Button>
         </div>
      </div>
   );
```

Add `cn` import if not already present — check the file first. If `cn` is not imported, add:
```typescript
import { cn } from "@packages/ui/lib/utils";
```

---

## Task 6: Migrate editor route from _editor to _dashboard

**Files:**
- Move: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_editor/$contentId.tsx` → `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/$contentId.tsx`
- Delete: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_editor.tsx`
- Update: `createFileRoute` string in the moved file

**Step 1: Copy the file to new location**

Create `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/$contentId.tsx` with the same content as the current `_editor/$contentId.tsx`, except change line 9–11:

Old:
```typescript
export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_editor/$contentId",
)({
```

New:
```typescript
export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/$contentId",
)({
```

Everything else stays identical (beforeLoad, component, EditorSkeleton, EditorRoute).

**Step 2: Delete the old route files**

```bash
rm apps/web/src/routes/_authenticated/'$slug'/'$teamSlug'/_editor/'$contentId'.tsx
rm apps/web/src/routes/_authenticated/'$slug'/'$teamSlug'/_editor.tsx
```

**Step 3: Verify route generation compiles**

```bash
bun run typecheck 2>&1 | head -30
```

Expected: no errors related to `_editor` or `_dashboard/$contentId`.

---

## Task 7: Update InternalLinksSidebar — fix useParams, remove internal header

**Files:**
- Modify: `apps/web/src/features/editor/plate/ui/internal-links-sidebar.tsx`

**Step 1: Update `useParams` from path**

Find (line 81–83):
```typescript
   const params = useParams({
      from: "/_authenticated/$slug/$teamSlug/_editor/$contentId",
   });
```

Replace with:
```typescript
   const params = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard/$contentId",
   });
```

**Step 2: Remove the header row from InternalLinksSidebar**

The context panel's icon tab row shows the tab label already. The internal header is redundant when shown in the context panel. Find and remove the header section from `InternalLinksSidebar`:

Find in `InternalLinksSidebar`:
```tsx
         {/* Header */}
         <div className="flex items-center gap-2 px-3 py-2.5 border-b">
            <Link2 className="size-3.5 text-muted-foreground/60 shrink-0" />
            <span className="text-sm font-semibold flex-1">
               Links do Cluster
            </span>
            {onClose && (
               <Button
                  className="size-6 rounded text-muted-foreground"
                  onClick={onClose}
                  size="icon"
                  type="button"
                  variant="ghost"
               >
                  <X className="size-3.5" />
               </Button>
            )}
         </div>
```

Remove the entire block (it is no longer needed).

**Step 3: Remove outer sizing classes from InternalLinksSidebar**

The context panel provides the container. Remove `h-full w-72 border-l` from the wrapper div. Change:
```tsx
         <div
            className={cn(
               "flex h-full w-72 flex-col border-l bg-background shrink-0",
               className,
            )}
         >
```
to:
```tsx
         <div
            className={cn("flex flex-col", className)}
         >
```

**Step 4: Remove unused imports**

Remove `Button`, `X`, `Link2` (or `Link2Off`) from imports if they're now unused. Keep whatever is still needed by `SuggestionsTable` (Link2 is used there for the empty state, X is removed from header, Button is still used in the table). Check carefully.

Actually:
- `Link2` — still used in `SuggestionsTable` for the empty state (`Link2Off`). Wait: `Link2Off` is the empty state icon, `Link2` was only in the header. Remove `Link2` import, keep `Link2Off`.
- `Button` — still used in `SuggestionsTable`. Keep.
- `X` — only used in the header. Remove.

Also remove `onClose` from `InternalLinksSidebarProps` and the component signature:
```typescript
interface InternalLinksSidebarProps {
   contentId: string;
   className?: string;
}

export function InternalLinksSidebar({
   contentId,
   className,
}: InternalLinksSidebarProps) {
```

---

## Task 8: Create EditorContextPanelTabs component

**Files:**
- Create: `apps/web/src/features/editor/plate/ui/editor-context-panel-tabs.tsx`

**Step 1: Write the component**

```tsx
"use client";

import type { ContentMeta } from "@packages/database/schemas/content";
import { Link2, Settings2 } from "lucide-react";
import { useEffect } from "react";
import {
   registerTab,
   unregisterTab,
} from "@/features/context-panel/use-context-panel";
import { FrontmatterSection } from "../../ui/frontmatter-section";
import { InternalLinksSidebar } from "./internal-links-sidebar";

interface EditorContextPanelTabsProps {
   contentId: string;
   meta: ContentMeta;
   onChange: (meta: ContentMeta) => void;
   readOnly: boolean;
}

export function EditorContextPanelTabs({
   contentId,
   meta,
   onChange,
   readOnly,
}: EditorContextPanelTabsProps) {
   // Settings tab: re-registers whenever meta/onChange/readOnly change
   // so the panel always renders fresh data
   useEffect(() => {
      registerTab({
         id: "settings",
         icon: Settings2,
         label: "Metadados",
         content: (
            <FrontmatterSection
               meta={meta}
               onChange={onChange}
               readOnly={readOnly}
            />
         ),
         order: 1,
      });
   }, [meta, onChange, readOnly]);

   // Links tab: registers once per contentId, cleans up on unmount
   useEffect(() => {
      registerTab({
         id: "links",
         icon: Link2,
         label: "Links do Cluster",
         content: <InternalLinksSidebar contentId={contentId} />,
         order: 2,
      });
      return () => {
         unregisterTab("links");
      };
   }, [contentId]);

   // Clean up settings tab on unmount
   useEffect(() => {
      return () => {
         unregisterTab("settings");
      };
   }, []);

   return null;
}
```

---

## Task 9: Update EditorPage — remove h-screen wrapper, remove sidebar state, add EditorContextPanelTabs

**Files:**
- Modify: `apps/web/src/features/editor/ui/editor-page.tsx`

**Step 1: Remove showSidebar state and onToggleSidebar**

Remove line 31:
```typescript
   const [showSidebar, setShowSidebar] = useState(true);
```

**Step 2: Add EditorContextPanelTabs import**

Add at top with other imports:
```typescript
import { EditorContextPanelTabs } from "../plate/ui/editor-context-panel-tabs";
```

**Step 3: Update the return block**

Old:
```tsx
   return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
         <PlateEditor
            contentId={contentId}
            editable={content.status !== "archived"}
            initialValue={
               content?.body ? (JSON.parse(content.body) as Value) : undefined
            }
            isSaving={isSaving}
            key={contentId}
            meta={meta}
            onBack={handleBack}
            onChange={(value) => {
               editorValueRef.current = value;
            }}
            onMetaChange={setMeta}
            onSave={handleSave}
            onStatusChange={handleStatusChange}
            onToggleSidebar={() => setShowSidebar((v) => !v)}
            showLinksSidebar={showSidebar}
            status={content.status as ContentStatus}
            teamId={content.teamId ?? undefined}
            writerId={content.writerId ?? undefined}
         />
      </div>
   );
```

New:
```tsx
   return (
      <div className="flex flex-col h-full">
         <EditorContextPanelTabs
            contentId={contentId}
            meta={meta}
            onChange={setMeta}
            readOnly={content.status === "archived"}
         />
         <PlateEditor
            contentId={contentId}
            editable={content.status !== "archived"}
            initialValue={
               content?.body ? (JSON.parse(content.body) as Value) : undefined
            }
            isSaving={isSaving}
            key={contentId}
            onBack={handleBack}
            onChange={(value) => {
               editorValueRef.current = value;
            }}
            onSave={handleSave}
            onStatusChange={handleStatusChange}
            status={content.status as ContentStatus}
            teamId={content.teamId ?? undefined}
            writerId={content.writerId ?? undefined}
         />
      </div>
   );
```

**Step 4: Remove unused useState import if `showSidebar` was the only usage**

Check if `useState` is still used (it is — `isSaving` still uses it). Keep it.

---

## Task 10: Update PlateEditor — remove FrontmatterSection, remove sidebar props

**Files:**
- Modify: `apps/web/src/features/editor/plate/plate-editor.tsx`

**Step 1: Remove props from PlateEditorProps interface**

Remove:
```typescript
   // NEW: frontmatter
   meta?: ContentMeta;
   onMetaChange?: (meta: ContentMeta) => void;
   // NEW: sidebar
   showLinksSidebar?: boolean;
   onToggleSidebar?: () => void;
```

Also remove from `ContentMeta` import (line 13) — only if `ContentMeta` is no longer used in this file. After removing `meta` and `onMetaChange` props, `ContentMeta` type is only needed if used elsewhere in the file. Remove it if no longer needed.

**Step 2: Remove from destructuring in PlateEditor function**

Remove `meta`, `onMetaChange`, `onToggleSidebar`, `showLinksSidebar` from the destructuring:
```typescript
export function PlateEditor({
   initialValue,
   onChange,
   placeholder = "Start writing…",
   editable = true,
   className,
   contentId,
   writerId,
   model,
   language,
   teamId,
   status,
   isSaving,
   onSave,
   onBack,
   onStatusChange,
}: PlateEditorProps) {
```

**Step 3: Remove FrontmatterSection from the render**

Remove:
```tsx
               {/* Frontmatter section */}
               {meta !== undefined && onMetaChange !== undefined && (
                  <FrontmatterSection
                     meta={meta}
                     onChange={onMetaChange}
                     readOnly={!editable}
                  />
               )}
```

**Step 4: Remove InternalLinksSidebar from the render**

Remove from the content area:
```tsx
                  {showLinksSidebar && contentId && (
                     <InternalLinksSidebar
                        contentId={contentId}
                        onClose={onToggleSidebar}
                     />
                  )}
```

**Step 5: Update EditorFixedToolbar call — remove sidebar props**

Find:
```tsx
               <EditorFixedToolbar
                  isSaving={isSaving}
                  onBack={onBack}
                  onSave={onSave}
                  onStatusChange={onStatusChange}
                  onToggleSidebar={onToggleSidebar}
                  showSidebar={showLinksSidebar}
                  status={...}
               />
```

Replace with:
```tsx
               <EditorFixedToolbar
                  isSaving={isSaving}
                  onBack={onBack}
                  onSave={onSave}
                  onStatusChange={onStatusChange}
                  status={
                     status as "draft" | "published" | "archived" | undefined
                  }
               />
```

**Step 6: Remove unused imports**

Remove:
- `FrontmatterSection` import (line 42)
- `InternalLinksSidebar` import (line 53)
- `ContentMeta` from `@packages/database/schemas/content` (if not used elsewhere in file)

---

## Task 11: Update EditorFixedToolbar — remove sidebar toggle

**Files:**
- Modify: `apps/web/src/features/editor/ui/editor-fixed-toolbar.tsx`

**Step 1: Remove sidebar props from interface**

Remove from `EditorFixedToolbarProps`:
```typescript
   showSidebar?: boolean;
   onToggleSidebar?: () => void;
```

**Step 2: Remove from destructuring**

Remove `showSidebar` and `onToggleSidebar` from the function destructuring.

**Step 3: Remove sidebar toggle button block**

Remove:
```tsx
            {/* Sidebar toggle */}
            {onToggleSidebar && (
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        className={cn(
                           "size-8 rounded",
                           showSidebar && "bg-accent text-accent-foreground",
                        )}
                        onClick={onToggleSidebar}
                        size="icon"
                        type="button"
                        variant="ghost"
                     >
                        <Link2Off className="size-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Links do cluster</TooltipContent>
               </Tooltip>
            )}
```

**Step 4: Remove unused imports**

Remove `Link2Off` from the lucide-react import.

> **Note:** Also check if `cn` is still needed in this file after removing the sidebar toggle. The status dropdown still uses `cn`, so keep it.

---

## Task 12: Typecheck + manual testing

**Step 1: Run typecheck**

```bash
bun run typecheck 2>&1 | grep -E "error|Error" | head -30
```

Expected: 0 errors.

**Step 2: Run dev server**

```bash
bun dev
```

**Step 3: Manual test checklist**

1. **Dashboard pages**: Open any non-editor page → TabBar visible, no context panel visible by default
2. **Toggle panel**: Click PanelRight button in TabBar → context panel opens at 320px with Chat tab active
3. **Close panel**: Click × in panel header → panel closes
4. **Toggle again**: State persists between open/close
5. **Chat tab**: Shows placeholder message
6. **Editor from content list**: Click content → editor opens inside DashboardLayout (AppSidebar + TabBar visible)
7. **Editor layout**: Editor fills available height, no double scrollbars, no p-4 padding
8. **Settings tab in editor**: Open context panel while in editor → Settings tab appears (icon: Settings2)
9. **Settings tab content**: Shows FrontmatterSection with title, description, slug, keywords fields
10. **Live sync**: Type in title field → Settings tab content updates in real time
11. **Links tab**: Click Links icon (Link2) → InternalLinksSidebar shown without redundant header
12. **Tab persistence**: Switch editor → dashboard page → Settings and Links tabs disappear from panel
13. **Back navigation**: Click ← Back in editor toolbar → navigates to content list
14. **Panel open on dashboard → open editor**: Panel stays open (isOpen persists in store)
15. **Panel open in editor → tab back to dashboard**: Panel still open, only Chat tab visible

**Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(ui): implement global context panel with 3-column layout

- Add GlobalContextPanel (right column, 320px) to DashboardLayout
- Migrate editor route from isolated _editor layout to _dashboard layout
- Move FrontmatterSection and InternalLinksSidebar into context panel tabs
- Add PanelRight toggle button to TabBar
- Dynamic tab registration via EditorContextPanelTabs (Settings + Links)
- Built-in Chat tab always visible as default panel tab

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Implementation Notes

### Height chain for editor
The editor relies on a chain of `flex flex-col h-full`:
1. `DashboardLayout <main>` → `flex-1 overflow-hidden p-0` (editor mode)
2. `EditorPage <div>` → `flex flex-col h-full`
3. `PlateEditor`'s content area `<div className="flex flex-1 overflow-hidden">` fills the rest

The `DndProvider` renders a plain wrapper div — it does NOT need explicit height classes because it's a `flex-1` child of `EditorPage`'s `h-full flex-col` container.

### Dynamic tabs update frequency
`EditorContextPanelTabs` re-runs the settings tab `useEffect` on every `meta` change (every keystroke in the title field). This calls `contextPanelStore.setState` on each keystroke. TanStack Store is synchronous and fast — no debounce needed. The context panel only re-renders if it's currently open and `dynamicTabs` changed.

### URL stays the same
Moving `$contentId.tsx` from `_editor/` to `_dashboard/` does NOT change the editor URL since both `_editor` and `_dashboard` are pathless layout routes (prefixed with `_`). All existing navigation links remain valid.

### FrontmatterSection collapse behavior
`FrontmatterSection` has an internal `isOpen` collapse state (defaults to `true`). When shown in the context panel, it will render expanded by default. The collapse toggle still works normally. No changes needed to `FrontmatterSection`.

### Chat tab future
The Chat tab shows a placeholder. The real implementation is tracked in issue #606 (Chat Experience 2.0). When that feature lands, replace `ChatPlaceholder` content by calling `registerTab` for the chat tab from the chat feature's mount point, or by rendering the real chat component directly in `CHAT_TAB.content`.
