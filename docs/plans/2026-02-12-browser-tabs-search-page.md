# Browser-Style Tabs + Search Page — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a PostHog-inspired browser-style tab bar to the dashboard, where every page navigation opens/focuses a tab. Include a dedicated search page that acts as the "new tab page" — opened via the "+" button (new tab) or the sidebar search button (replaces current tab).

**Architecture:** A TanStack Store manages tab state (open tabs, active tab, order). The tab bar renders inside `SidebarInset` above the main content area. Route changes sync bidirectionally with the tab store. Tabs persist to localStorage scoped by org+team. The search page is a standard dashboard route that acts as a transient navigation state.

**Tech Stack:** TanStack Store, TanStack Router, localStorage, React, Tailwind CSS, Radix primitives

---

## Core Concepts

### Tab Data Model

```ts
type TabType =
  | "home"
  | "content-list"
  | "content-editor"
  | "dashboard"
  | "insight"
  | "form"
  | "form-submissions"
  | "settings"
  | "search"
  | "data-management"
  | "billing"
  | "plans"
  | "generic";

type Tab = {
  id: string;                        // nanoid — stable across route changes within the tab
  route: string;                     // TanStack Router path (e.g. "/$slug/$teamId/home")
  params: Record<string, string>;    // route params (slug, teamId, contentId, etc.)
  search?: Record<string, unknown>;  // query string params
  label: string;                     // display name ("Home", "My Dashboard", content title)
  icon?: string;                     // lucide icon name (derived from TabType)
  type: TabType;                     // determines icon, behavior, deduplication key
  isPinned?: boolean;                // pinned tabs can't be closed, always at the left
  isDirty?: boolean;                 // unsaved changes indicator (for editor)
  openedAt: number;                  // timestamp — for ordering and "recent" logic
};
```

### Tab Identity & Deduplication

When opening a tab, we check for an existing tab by matching `route + params` (ignoring search/query params). If found, we focus it instead of creating a duplicate.

**Deduplication key:** `${route}::${JSON.stringify(sortedParams)}`

### Search Page Behaviors

| Trigger | Behavior |
|---------|----------|
| **"+" button on tab bar** | Creates a new tab with `type: "search"`, navigates to `/search` |
| **Sidebar search button** | Updates the **current active tab** to `type: "search"`, navigates to `/search` |
| **Selecting a search result** | Updates the **same tab** (route, label, icon, type all change to destination) |
| **Quick action (e.g. "New Content")** | Creates the item, then updates the tab to the new item's page |

The search page is transient — it transforms into whatever the user navigates to.

### Tab Lifecycle

1. **Creation**: Sidebar click, "+" button, direct URL, or programmatic `openTab()`
2. **Focus**: Clicking a tab, or navigating to a route that matches an existing tab
3. **Update**: Search result selection, page title changes (content rename), dirty state
4. **Close**: Click "×", Ctrl+W, or context menu. Focuses adjacent tab. If last tab, creates Home.
5. **Persist**: On every state change, serialize to localStorage

### Default State

When no tabs exist (first visit, cleared storage):
- Auto-create a pinned **Home** tab (`/$slug/$teamId/home`)

---

## Layout Integration

### Current Layout

```
SidebarManagerProvider
  SidebarProvider
    SidebarManager("main") → AppSidebar
    SidebarInset
      SidebarSubPanel
      <main>{children}</main>
```

### New Layout

```
SidebarManagerProvider
  SidebarProvider
    SidebarManager("main") → AppSidebar
    SidebarInset
      SidebarSubPanel
      TabBar                    ← NEW: between sub-panel and main
        TabItem[]
        NewTabButton
      <main>{children}</main>   ← unchanged, route content renders here
```

The `TabBar` is a **thin horizontal strip** at the top of the content area. It does NOT wrap the content — it's a sibling to `<main>`.

---

## Component Breakdown

### 1. Tab Store — `apps/web/src/hooks/use-tab-store.ts`

TanStack Store with these operations:

```ts
// Read
getTabs(): Tab[]
getActiveTab(): Tab | null
getActiveTabId(): string | null

// Write
openTab(tab: Omit<Tab, "id" | "openedAt">): string  // returns new tab id
closeTab(tabId: string): void
focusTab(tabId: string): void
updateTab(tabId: string, updates: Partial<Tab>): void
replaceCurrentTab(updates: Partial<Tab>): void  // updates active tab's route/label/type
reorderTabs(fromIndex: number, toIndex: number): void
pinTab(tabId: string): void
unpinTab(tabId: string): void
closeOtherTabs(keepTabId: string): void
closeAllTabs(): void  // keeps pinned tabs

// Persistence
persistTabs(): void   // serialize to localStorage
loadTabs(): void      // deserialize from localStorage
```

**localStorage key:** `contentta:tabs:{orgSlug}:{teamId}`

**Stored shape:**
```json
{
  "tabs": [...],
  "activeTabId": "abc123"
}
```

### 2. Tab Bar — `apps/web/src/layout/dashboard/ui/tab-bar.tsx`

- Horizontal scrollable container (`overflow-x-auto`, hide scrollbar)
- Scroll shadow indicators on left/right when content overflows
- Height: ~36px (compact, similar to browser tabs)
- Background: matches sidebar background or slightly different surface
- Border-bottom to separate from content

### 3. Tab Item — `apps/web/src/layout/dashboard/ui/tab-item.tsx`

- Icon (from TabType mapping) + truncated label + close button
- Max width: ~200px, min width: ~100px
- Active state: bottom border accent color, brighter text
- Hover: show close button (hidden by default for inactive tabs to save space)
- Pinned: icon only, no close button, fixed at left
- Dirty indicator: small dot on the tab (like VS Code unsaved dot)
- Right-click: context menu (Close, Close Others, Close All, Pin/Unpin)

### 4. Route ↔ Tab Sync — `apps/web/src/layout/dashboard/hooks/use-tab-router-sync.ts`

A custom hook used in `DashboardLayout` that:

```ts
function useTabRouterSync() {
  const location = useLocation();
  const router = useRouter();
  const { tabs, activeTab, openTab, focusTab } = useTabStore();

  // Direction 1: Route changed → sync tabs
  useEffect(() => {
    const matchingTab = findTabByRoute(tabs, location);
    if (matchingTab) {
      if (matchingTab.id !== activeTab?.id) {
        focusTab(matchingTab.id);  // just focus, don't navigate (already there)
      }
    } else {
      // New route with no tab → create one
      const newTab = routeToTab(location);
      openTab(newTab);
    }
  }, [location.pathname]);

  // Direction 2: Tab clicked → navigate
  const navigateToTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    focusTab(tabId);
    router.navigate({ to: tab.route, params: tab.params, search: tab.search });
  };

  return { navigateToTab };
}
```

**Loop prevention:** Use a ref flag `isTabNavigating` that's set before programmatic navigation and cleared after, so the location watcher skips when the change was tab-initiated.

### 5. Route → Tab Metadata Mapping — `apps/web/src/layout/dashboard/utils/route-to-tab.ts`

Maps route patterns to tab metadata:

```ts
const ROUTE_TAB_MAP: Array<{
  pattern: RegExp;
  type: TabType;
  icon: string;
  labelFn: (params: Record<string, string>) => string;
}> = [
  { pattern: /\/home$/, type: "home", icon: "House", labelFn: () => "Home" },
  { pattern: /\/content$/, type: "content-list", icon: "FileText", labelFn: () => "Content" },
  { pattern: /\/content\//, type: "content-editor", icon: "FileText", labelFn: (p) => p.contentId ?? "Content" },
  { pattern: /\/analytics\/dashboards\//, type: "dashboard", icon: "LayoutDashboard", labelFn: (p) => p.dashboardId ?? "Dashboard" },
  { pattern: /\/analytics\/insights\//, type: "insight", icon: "Lightbulb", labelFn: (p) => p.insightId ?? "Insight" },
  { pattern: /\/forms\//, type: "form", icon: "ClipboardList", labelFn: (p) => p.formId ?? "Form" },
  { pattern: /\/settings/, type: "settings", icon: "Settings", labelFn: () => "Settings" },
  { pattern: /\/search$/, type: "search", icon: "Search", labelFn: () => "Search" },
  { pattern: /\/billing$/, type: "billing", icon: "CreditCard", labelFn: () => "Billing" },
  { pattern: /\/plans$/, type: "plans", icon: "Sparkles", labelFn: () => "Plans" },
  // ... etc
];
```

**Note:** For detail pages (content, dashboards, insights), the initial label is a placeholder (the ID). Once the page component mounts and fetches data, it calls `updateTab(tabId, { label: actualTitle })` to show the real name.

### 6. Search Page — `apps/web/src/features/search/ui/search-page.tsx`

**Pre-search state (empty query):**
- Large centered search input, auto-focused
- "Recent" section: last 5-10 visited tabs (from tab store history or separate recent list)
- "Quick Actions" grid: New Content, New Dashboard, New Form, New Insight

**Search results state (typing):**
- Results grouped by type: Content, Dashboards, Insights, Forms, Settings
- Each group shows up to 5 results with a "Show all" link
- Keyboard navigation: ↑↓ to move, Enter to select, Esc to clear

**Search implementation (MVP — client-side):**
- Aggregate data from existing TanStack Query caches (content list, dashboards, insights, forms)
- Simple fuzzy match on title/name fields
- No new API endpoint needed for MVP

**Search route:** `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/search.tsx`

### 7. Sidebar Integration

The sidebar's navigation behavior changes slightly:

**Current:** `router.navigate({ to: item.route, params })`
**New:** `tabStore.openTab({ route, params, type, label }) + router.navigate()`

This is best done by creating a `useTabNavigation()` hook that wraps both the tab store and router:

```ts
function useTabNavigation() {
  const { openTab, focusTab, findTabByRoute, replaceCurrentTab } = useTabStore();
  const router = useRouter();

  const navigate = (route, params, opts?: { replace?: boolean }) => {
    if (opts?.replace) {
      // Replace current tab (used by search)
      replaceCurrentTab({ route, params, ... });
      router.navigate({ to: route, params });
    } else {
      // Normal: open/focus tab
      const existing = findTabByRoute(route, params);
      if (existing) {
        focusTab(existing.id);
      } else {
        openTab({ route, params, ... });
      }
      router.navigate({ to: route, params });
    }
  };

  return { navigate };
}
```

---

## Phase-by-Phase Implementation

### Phase 1: Tab Store (foundation)

**Files to create:**
- `apps/web/src/hooks/use-tab-store.ts`

**What to build:**
1. TanStack Store with `tabs: Tab[]` and `activeTabId: string | null`
2. All CRUD operations (openTab, closeTab, focusTab, updateTab, replaceCurrentTab)
3. localStorage persistence (save on every mutation, load on init)
4. Scoped key: `contentta:tabs:{orgSlug}:{teamId}`
5. Default state: single pinned Home tab
6. Deduplication logic: find existing tab by route+params

**Verification:** Unit test the store operations — open, close, focus, persist, load, deduplicate.

---

### Phase 2: Tab Bar UI (presentational)

**Files to create:**
- `apps/web/src/layout/dashboard/ui/tab-bar.tsx`
- `apps/web/src/layout/dashboard/ui/tab-item.tsx`

**What to build:**
1. `TabBar` — horizontal scrollable container, "+" button at end
2. `TabItem` — icon + label + close button, active/inactive/pinned states
3. Wire to tab store (read tabs, active tab)
4. onClick → `focusTab()` (no routing yet)
5. onClose → `closeTab()`
6. onNew → `openTab({ type: "search" })`
7. Scroll shadows for overflow indication

**Verification:** Visually test with mock tabs. Verify scroll, active state, close behavior.

---

### Phase 3: Router ↔ Tab Sync

**Files to create:**
- `apps/web/src/layout/dashboard/hooks/use-tab-router-sync.ts`
- `apps/web/src/layout/dashboard/utils/route-to-tab.ts`

**Files to modify:**
- `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx` — add TabBar + sync hook

**What to build:**
1. `routeToTab()` utility — maps current location to Tab metadata
2. `useTabRouterSync()` hook — bidirectional sync between router and tab store
3. Loop prevention with ref flag
4. Integrate into `DashboardLayout`: mount `TabBar` and `useTabRouterSync()`
5. Tab click → `router.navigate()`
6. Route change → create/focus matching tab

**Verification:** Navigate via sidebar → tab appears. Click tab → route changes. Refresh → tabs restore from localStorage.

---

### Phase 4: Search Page

**Files to create:**
- `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/search.tsx`
- `apps/web/src/features/search/ui/search-page.tsx`
- `apps/web/src/features/search/hooks/use-search.ts`

**Files to modify:**
- Sidebar search button → navigate to search (replace current tab)
- Tab bar "+" button → open new tab at search

**What to build:**
1. Search route file with `createFileRoute`
2. Search page component: centered input, recent items, quick actions
3. Search results grouped by type with keyboard navigation
4. `useSearch()` hook — client-side fuzzy search across cached query data
5. Wire "+" button to create new search tab
6. Wire sidebar search to replace current tab with search
7. Result selection → `replaceCurrentTab()` with destination

**Verification:** "+" opens search in new tab. Sidebar search replaces current tab. Selecting result navigates within the same tab. Tab label updates from "Search" to destination name.

---

### Phase 5: Polish & Enhancements

**What to build:**
1. Keyboard shortcuts: Ctrl+W (close), Ctrl+Tab (next), Ctrl+Shift+Tab (prev), Ctrl+T (new)
2. Tab context menu (right-click): Close, Close Others, Close All, Pin/Unpin
3. Tab dirty state integration with content editor
4. Drag-to-reorder with @dnd-kit
5. Animated tab open/close (Framer Motion or CSS transitions)
6. Scroll-into-view for active tab when switching
7. Tab title updates from page data (content title, dashboard name, etc.)
8. Middle-click to open in background tab

---

## What Stays Unchanged

- **AppSidebar** — stays exactly as-is structurally. Only change: navigation calls go through `useTabNavigation()` instead of direct `router.navigate()`
- **Settings layout** with nested sidebar — renders inside the tab's content area
- **Editor layout** — renders inside a tab (editor page = one tab)
- **SidebarSubPanel** — independent of tab system, continues to work for analytics sections
- **DefaultHeader** — continues to be used by pages, unaware of tabs
- **All existing routes** — no route changes needed except adding the search route

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Last tab closed | Auto-create and navigate to pinned Home tab |
| Org/team switch | Clear all tabs, start fresh with Home for new org+team |
| Tab for deleted resource | Show "Not Found" in the page content. User closes the tab. |
| Browser back/forward | Navigates route, tab sync picks it up and focuses matching tab |
| Deep link (shared URL) | Opens as a new tab if none matches |
| Many tabs (20+) | Horizontal scroll with shadow indicators. No limit enforced. |
| Same page, different query params | Treated as same tab (dedup ignores search params) |
| Same page, different route params | Different tabs (e.g. two different dashboards = two tabs) |
