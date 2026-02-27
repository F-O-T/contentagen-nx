# Layout Standardization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate layout anti-patterns (duplicate effects, bad deps, stale refs) and standardize state management across ContextPanel, SubSidebar, MainSidebar, and SidebarManager.

**Architecture:** Phase 1 fixes three isolated bugs; Phase 2 makes the sub-sidebar fully store-driven (no local useState for searchQuery); Phase 3 moves section activation from a pathname-watching useEffect in the layout parent to co-located hooks inside each analytics route component.

**Tech Stack:** TanStack Store, TanStack Router, React, Radix/Shadcn Sidebar, TypeScript.

**Issue reference:** #740

---

## Phase 1 — Quick Fixes

### Task 1: Fix `useContextPanelInfo` dependency array

**Files:**
- Modify: `apps/web/src/features/context-panel/use-context-panel.ts:40-46`

**Context:** `useContextPanelInfo` registers `content` (a ReactNode) into the context panel store. The dependency array is intentionally empty to avoid stale content but this is incorrect — if the caller re-renders with new content (e.g., after async data loads), the panel will show stale content.

**Step 1: Remove biome-ignore and add content dep**

Replace `use-context-panel.ts:40-46`:
```typescript
// BEFORE
export const useContextPanelInfo = (content: React.ReactNode) => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: content is intentionally stable on mount
  useEffect(() => {
    setInfoContent(content);
    return () => clearInfoContent();
  }, []);
};

// AFTER
export const useContextPanelInfo = (content: React.ReactNode) => {
  useEffect(() => {
    setInfoContent(content);
    return () => clearInfoContent();
  }, [content]);
};
```

**Step 2: Verify callers remain correct**

Known callers (search with `grep -r "useContextPanelInfo" apps/web/src`):
- `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/dashboards/index.tsx` — static JSX, no problem
- `apps/web/src/features/content/ui/content-list-section.tsx` — static JSX, no problem

No changes needed to callers.

**Step 3: Verify TypeScript**
```bash
bun run typecheck
```
Expected: no new errors.

**Step 4: Commit**
```bash
git add apps/web/src/features/context-panel/use-context-panel.ts
git commit -m "fix(context-panel): add content to useContextPanelInfo deps array"
```

---

### Task 2: Remove ThemeSwitcher mounted pattern

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/theme-switcher.tsx`

**Context:** The `mounted` pattern (`useState(false)` + `useEffect(() => setMounted(true), [])` + `if (!mounted) return null`) causes a visual flash on mount. This is a pure client-side Vite SPA — no SSR. `useTheme()` already reads `theme` from localStorage on first render via the `isBrowser` check in the ThemeProvider's `useState` initializer, so the theme is correct from the first render. The `mounted` guard is unnecessary.

**Step 1: Remove mounted state, effect, and guard**

In `theme-switcher.tsx`:
- Remove: `const [mounted, setMounted] = useState(false);`
- Remove: the `useEffect(() => { setMounted(true); }, []);`
- Remove: `if (!mounted) { return null; }`
- Remove `useEffect` from the import (keep `useCallback`)

The file's import line changes from:
```typescript
import { useCallback, useEffect, useState } from "react";
```
to:
```typescript
import { useCallback } from "react";
```

**Step 2: Verify TypeScript**
```bash
bun run typecheck
```

**Step 3: Manual visual check**
Run `bun dev`, navigate to the sidebar. The theme switcher should render immediately on mount without a flash.

**Step 4: Commit**
```bash
git add apps/web/src/layout/dashboard/ui/theme-switcher.tsx
git commit -m "fix(theme-switcher): remove unnecessary mounted guard pattern"
```

---

### Task 3: Consolidate duplicate SidebarManager registration effects

**Files:**
- Modify: `packages/ui/src/components/sidebar.tsx:115-240`

**Context:** Both `SidebarManagerShared` (lines 115–143) and `SidebarManagerIsolated` (lines 145–239) have two `useEffect`s that both call `manager.register(name, ...)`. The first effect uses refs for initial registration + cleanup. The second effect keeps the registration fresh when context changes but has no cleanup. The `manager` object itself must NOT go in deps because `manager` is recreated whenever any sidebar registers/unregisters, which would cause an infinite registration loop. We keep refs for the manager but drop the redundant second effect.

**Step 1: Consolidate SidebarManagerShared (lines ~115–143)**

Remove both effects and the unused `sidebarContextRef`. Keep `managerRef` for stable unregister.

Replace the block:
```typescript
const sidebarContextRef = React.useRef(sidebarContext);
const managerRef = React.useRef(manager);

React.useLayoutEffect(() => {
  sidebarContextRef.current = sidebarContext;
  managerRef.current = manager;
});

React.useEffect(() => {
  managerRef.current.register(name, sidebarContextRef.current);
  return () => managerRef.current.unregister(name);
}, [name]);

React.useEffect(() => {
  managerRef.current.register(name, sidebarContext);
}, [name, sidebarContext]);
```

With:
```typescript
const managerRef = React.useRef(manager);

React.useLayoutEffect(() => {
  managerRef.current = manager;
});

React.useEffect(() => {
  managerRef.current.register(name, sidebarContext);
  return () => managerRef.current.unregister(name);
}, [name, sidebarContext]);
```

**Step 2: Consolidate SidebarManagerIsolated (lines ~213–227)**

Replace:
```typescript
const managerRef = React.useRef(manager);
const contextRef = React.useRef(contextValue);
React.useLayoutEffect(() => {
  managerRef.current = manager;
  contextRef.current = contextValue;
});

React.useEffect(() => {
  managerRef.current.register(name, contextRef.current);
  return () => managerRef.current.unregister(name);
}, [name]);

React.useEffect(() => {
  managerRef.current.register(name, contextValue);
}, [name, contextValue]);
```

With:
```typescript
const managerRef = React.useRef(manager);

React.useLayoutEffect(() => {
  managerRef.current = manager;
});

React.useEffect(() => {
  managerRef.current.register(name, contextValue);
  return () => managerRef.current.unregister(name);
}, [name, contextValue]);
```

**Step 3: Verify TypeScript**
```bash
bun run typecheck
```

**Step 4: Manual verification**
Run `bun dev`. Navigate around the dashboard — the main sidebar, sub-panel, and context panel should all render and respond normally. No console errors.

**Step 5: Commit**
```bash
git add packages/ui/src/components/sidebar.tsx
git commit -m "fix(sidebar): consolidate duplicate SidebarManager registration effects"
```

---

## Phase 2 — Sub-Sidebar Store-Driven

### Task 4: Add `searchQuery` to sidebarNavStore

**Files:**
- Modify: `apps/web/src/layout/dashboard/hooks/use-sidebar-nav.ts`

**Context:** Currently `searchQuery` lives in `useState` inside `SubPanelSidebar`. It gets reset via a `useEffect` when `activeSection` changes. Moving it to the store eliminates both the local state and the useEffect reset.

**Step 1: Update the store interface and initial state**

```typescript
// BEFORE
interface SidebarNavState {
  activeSection: SubSidebarSection | null;
  pinnedItems: string[];
}

const initialState: SidebarNavState = {
  activeSection: null,
  pinnedItems: loadPinnedItems(),
};

// AFTER
interface SidebarNavState {
  activeSection: SubSidebarSection | null;
  searchQuery: string;
  pinnedItems: string[];
}

const initialState: SidebarNavState = {
  activeSection: null,
  searchQuery: "",
  pinnedItems: loadPinnedItems(),
};
```

**Step 2: Update `setActiveSection` to reset searchQuery**

```typescript
// BEFORE
export function setActiveSection(section: SubSidebarSection | null) {
  sidebarNavStore.setState((state) => ({
    ...state,
    activeSection: section,
  }));
}

// AFTER
export function setActiveSection(section: SubSidebarSection | null) {
  sidebarNavStore.setState((state) => ({
    ...state,
    activeSection: section,
    searchQuery: "",
  }));
}
```

**Step 3: Add `setSearchQuery` export**

After `setActiveSection`:
```typescript
export function setSearchQuery(query: string) {
  sidebarNavStore.setState((state) => ({
    ...state,
    searchQuery: query,
  }));
}
```

**Step 4: Return `searchQuery` and `setSearchQuery` from `useSidebarNav`**

```typescript
// BEFORE
export function useSidebarNav() {
  const state = useStore(sidebarNavStore);
  return {
    activeSection: state.activeSection,
    pinnedItems: state.pinnedItems,
  };
}

// AFTER
export function useSidebarNav() {
  const state = useStore(sidebarNavStore);
  return {
    activeSection: state.activeSection,
    searchQuery: state.searchQuery,
    pinnedItems: state.pinnedItems,
    setSearchQuery,
  };
}
```

**Step 5: Verify TypeScript**
```bash
bun run typecheck
```

**Step 6: Commit**
```bash
git add apps/web/src/layout/dashboard/hooks/use-sidebar-nav.ts
git commit -m "feat(sidebar-nav): add searchQuery to store, reset on section change"
```

---

### Task 5: Make SubPanelSidebar fully store-driven

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/sidebar-sub-panel.tsx`

**Context:** Two `useEffect`s remain in `SubPanelSidebar`:
1. Resets `searchQuery` when `activeSection` changes — now handled by `setActiveSection`
2. Calls `setOpen(false)` when `activeSection` becomes null — replaced by making `SidebarProvider` controlled

**Step 1: Make `SidebarSubPanel` control open state from store**

The `SidebarProvider` wrapping the sub-panel needs to be controlled via the store. When `activeSection` becomes null, the panel closes. When user closes (backdrop/X button), `setActiveSection(null)` is called.

Replace the `SidebarSubPanel` component:
```typescript
// BEFORE
export function SidebarSubPanel() {
  const { activeSection } = useSidebarNav();
  return (
    <SidebarProvider className="min-h-0" defaultOpen={false}>
      <SidebarManager name="sub-panel">
        <SubPanelSidebar activeSection={activeSection} />
      </SidebarManager>
    </SidebarProvider>
  );
}

// AFTER
export function SidebarSubPanel() {
  const { activeSection } = useSidebarNav();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setActiveSection(null);
    },
    [],
  );

  return (
    <SidebarProvider
      className="min-h-0"
      onOpenChange={handleOpenChange}
      open={activeSection !== null}
    >
      <SidebarManager name="sub-panel">
        <SubPanelSidebar activeSection={activeSection} />
      </SidebarManager>
    </SidebarProvider>
  );
}
```

**Step 2: Remove `useState`, both `useEffect`s, and wire searchQuery from store**

Replace the `SubPanelSidebar` component:
```typescript
// BEFORE
function SubPanelSidebar({
  activeSection,
}: {
  activeSection: SubSidebarSection | null;
}) {
  const { open, setOpen } = useSidebar();
  const manager = useSidebarManager();
  const mainSidebar = manager.use("main");
  const panelLeft =
    mainSidebar?.state === "collapsed"
      ? "calc(var(--sidebar-width-icon) - 1px)"
      : "calc(var(--sidebar-width) - 1px)";
  const [searchQuery, setSearchQuery] = useState("");

  const handleItemClick = useCallback(() => {
    setOpen(false);
    setActiveSection(null);
  }, [setOpen]);

  // Reset search when section changes
  useEffect(() => {
    setSearchQuery("");
  }, [activeSection]);

  // Close when no active section
  useEffect(() => {
    if (!activeSection && open) {
      setOpen(false);
    }
  }, [activeSection, open, setOpen]);

  if (!open || !activeSection) return null;
  // ...
}

// AFTER
function SubPanelSidebar({
  activeSection,
}: {
  activeSection: SubSidebarSection | null;
}) {
  const { open } = useSidebar();
  const { searchQuery, setSearchQuery } = useSidebarNav();
  const manager = useSidebarManager();
  const mainSidebar = manager.use("main");
  const panelLeft =
    mainSidebar?.state === "collapsed"
      ? "calc(var(--sidebar-width-icon) - 1px)"
      : "calc(var(--sidebar-width) - 1px)";

  const handleItemClick = useCallback(() => {
    setActiveSection(null);
  }, []);

  if (!open || !activeSection) return null;
  // ... (rest of JSX unchanged, use searchQuery/setSearchQuery from store)
}
```

**Step 3: Update Input's onChange to use `setSearchQuery` from store**

```typescript
// BEFORE
onChange={(e) => setSearchQuery(e.target.value)}

// AFTER
onChange={(e) => setSearchQuery(e.target.value)}
// (same call, but now setSearchQuery comes from useSidebarNav() not useState)
```

**Step 4: Update imports** — remove `useEffect`, `useState` from React imports. Keep `useCallback`.

**Step 5: Verify TypeScript**
```bash
bun run typecheck
```

**Step 6: Manual verification**
- Open a dashboards sub-panel. Search for something. Navigate to insights section. Search box should be cleared.
- Close via backdrop/X. Panel should close and section should deactivate.
- No console errors.

**Step 7: Commit**
```bash
git add apps/web/src/layout/dashboard/ui/sidebar-sub-panel.tsx
git commit -m "refactor(sub-panel): make SubPanelSidebar fully store-driven, remove useEffects"
```

---

## Phase 3 — Route-Based Section Sync

### Task 6: Add `useSidebarSection` hook to use-sidebar-nav

**Files:**
- Modify: `apps/web/src/layout/dashboard/hooks/use-sidebar-nav.ts`

**Context:** We need a hook that sets the active section when a component mounts and clears it when the component unmounts (navigates away). This moves section activation from the dashboard-layout's pathname-watching `useEffect` into each analytics route.

**Step 1: Add the hook**

Add after the existing hooks in `use-sidebar-nav.ts`:
```typescript
export function useSidebarSection(section: SubSidebarSection) {
  useEffect(() => {
    setActiveSection(section);
    return () => setActiveSection(null);
  }, [section]);
}
```

**Note:** This requires adding `useEffect` import from `"react"` to the file (currently only `useStore` is imported from `@tanstack/react-store`).

```typescript
// BEFORE
import { Store, useStore } from "@tanstack/react-store";

// AFTER
import { Store, useStore } from "@tanstack/react-store";
import { useEffect } from "react";
```

**Step 2: Verify TypeScript**
```bash
bun run typecheck
```

**Step 3: Commit**
```bash
git add apps/web/src/layout/dashboard/hooks/use-sidebar-nav.ts
git commit -m "feat(sidebar-nav): add useSidebarSection hook for route-level section activation"
```

---

### Task 7: Activate sections in analytics route components

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/dashboards/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/dashboards/$dashboardId.tsx`
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/new.tsx`
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/$insightId.tsx`
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/data-management.tsx`

**Context:** Add `useSidebarSection("dashboards" | "insights" | "data-management")` to each analytics route's page component. This replaces the pathname-checking useEffect in dashboard-layout.

**Step 1: Add to dashboards routes**

In `analytics/dashboards/index.tsx`, in `DashboardsPage` function body (first line):
```typescript
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";

function DashboardsPage() {
  useSidebarSection("dashboards");
  // ... rest unchanged
}
```

In `analytics/dashboards/$dashboardId.tsx`, find the page component function, add:
```typescript
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";

function DashboardViewPage() {
  useSidebarSection("dashboards");
  // ... rest unchanged
}
```

**Step 2: Add to insights routes**

In `analytics/insights/index.tsx`, in `InsightsListPage`:
```typescript
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";

function InsightsListPage() {
  useSidebarSection("insights");
  // ... rest unchanged
}
```

In `analytics/insights/new.tsx`, in `NewInsightPage`:
```typescript
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";

function NewInsightPage() {
  useSidebarSection("insights");
  // ... rest unchanged
}
```

In `analytics/insights/$insightId.tsx`, in `EditInsightPage`:
```typescript
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";

function EditInsightPage() {
  useSidebarSection("insights");
  // ... rest unchanged
}
```

**Step 3: Add to data-management layout route**

In `analytics/data-management.tsx`, the layout component `DataManagementLayoutRoute`:
```typescript
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";

function DataManagementLayoutRoute() {
  useSidebarSection("data-management");
  return (
    <DataManagementLayout>
      <Outlet />
    </DataManagementLayout>
  );
}
```

This covers all data-management sub-routes automatically since it's a layout.

**Step 4: Verify TypeScript**
```bash
bun run typecheck
```

**Step 5: Commit**
```bash
git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/analytics/
git commit -m "feat(routes): activate sidebar sections via useSidebarSection in analytics routes"
```

---

### Task 8: Remove pathname useEffect from dashboard-layout

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`

**Context:** Now that each analytics route activates its own section via `useSidebarSection`, the pathname-watching `useEffect` in `dashboard-layout.tsx:132-142` is redundant and should be removed. Also remove the `pathname` and `setActiveSection` imports if no longer needed.

**Step 1: Remove the useEffect**

Remove from `dashboard-layout.tsx`:
```typescript
// DELETE THESE LINES (132-142)
useEffect(() => {
  if (pathname.includes("/analytics/dashboards")) {
    setActiveSection("dashboards");
  } else if (pathname.includes("/analytics/insights")) {
    setActiveSection("insights");
  } else if (pathname.includes("/analytics/data-management")) {
    setActiveSection("data-management");
  } else {
    setActiveSection(null);
  }
}, [pathname]);
```

**Step 2: Remove unused imports**

If `setActiveSection` is no longer used in `dashboard-layout.tsx`:
```typescript
// Remove from import:
import { setActiveSection } from "../hooks/use-sidebar-nav";
```

Keep `useLocation` if still used (check: `pathname` is used for `isSettingsPage`, `isEditorPage`, `isChatPage`). Keep `useLocation`.

**Step 3: Verify TypeScript and no unused variables**
```bash
bun run typecheck
bun run check
```

**Step 4: Manual verification**
- Navigate to `/analytics/dashboards` — sub-panel should open with dashboards section
- Navigate to `/analytics/insights` — sub-panel should switch to insights
- Navigate to `/analytics/data-management/event-definitions` — sub-panel should show data-management
- Navigate to `/content` — sub-panel should close (section becomes null)

**Step 5: Commit**
```bash
git add apps/web/src/layout/dashboard/ui/dashboard-layout.tsx
git commit -m "refactor(layout): remove pathname-based section sync useEffect"
```

---

## Phase 4 — Internal Sidebar Review

### Task 9: Verify InternalLinksSidebar integration

**Files:**
- Review: `apps/web/src/features/editor/plate/ui/internal-links-sidebar.tsx`

**Context:** The issue flags this component for review after the `useContextPanelInfo` dep fix. `InternalLinksSidebar` itself does NOT call `useContextPanelInfo` — it's a pure display component. The parent that registers it as a context panel tab is what matters.

**Step 1: Find how InternalLinksSidebar is registered as a tab**
```bash
grep -r "InternalLinksSidebar\|registerTab\|internal-links" apps/web/src --include="*.tsx" -l
```

**Step 2: Verify the registering component**

If a component calls `registerTab` with `<InternalLinksSidebar />` as content, verify it's correct after the Phase 1 fix. No changes expected — `registerTab` is called imperatively, not via `useContextPanelInfo`.

**Step 3: Confirm no issues**

Run the app and open an editor page. Verify the internal links sidebar tab appears in the context panel and works correctly.

**Step 4: Commit if any fix needed, otherwise no commit.**

---

## Final Verification

**Step 1: Run full typecheck**
```bash
bun run typecheck
```

**Step 2: Run linter**
```bash
bun run check
```

**Step 3: Run tests**
```bash
bun run test
```

**Step 4: Smoke test in dev**
```bash
bun dev
```
Navigate through: content list → dashboards → dashboard detail → insights → new insight → data management → back to content. Verify:
- Sub-panel opens/closes correctly for analytics sections
- Search resets when switching sections
- No console errors
- Theme switcher renders without flash
- Sidebar manager works (expand/collapse main sidebar while sub-panel is open)
