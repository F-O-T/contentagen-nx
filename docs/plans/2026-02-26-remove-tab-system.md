# Remove Global Tab System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the browser-like tab bar and all related infrastructure from the dashboard layout, and close all open GitHub issues tracking tab system bugs.

**Architecture:** 7 files to delete, 4 files to simplify (strip tab calls, keep navigation logic), 6 GitHub issues to close. No new abstractions — just deletion.

**Tech Stack:** React, TanStack Router, TanStack Store, Biome (linter)

---

## Files to DELETE (entirely)

| File | Reason |
|------|--------|
| `apps/web/src/hooks/use-tab-store.ts` | Core tab state — gone |
| `apps/web/src/hooks/use-tab-title.ts` | Tab title sync hook — gone |
| `apps/web/src/layout/dashboard/ui/tab-bar.tsx` | Tab bar UI — gone |
| `apps/web/src/layout/dashboard/ui/tab-item.tsx` | Tab item UI — gone |
| `apps/web/src/layout/dashboard/hooks/use-tab-router-sync.ts` | Router↔tab sync — gone |
| `apps/web/src/layout/dashboard/hooks/use-tab-keyboard-shortcuts.ts` | Keyboard shortcuts — gone |
| `apps/web/src/layout/dashboard/utils/route-to-tab.ts` | Route metadata mapping — gone |

## Files to MODIFY

| File | Change |
|------|--------|
| `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx` | Remove TabBar render + tab hook calls |
| `apps/web/src/layout/dashboard/ui/sidebar-nav.tsx` | Remove `replaceCurrentTab`/`tabStore` usage from search handler |
| `apps/web/src/features/search/ui/search-page.tsx` | Remove `replaceCurrentTab`/`resolveTabMetadata` from navigation |
| `apps/web/src/features/search/hooks/use-search.ts` | Remove `TabType` import and `tabType` field |

## GitHub Issues to CLOSE

Issues #719, #720, #722, #723, #724, #726, #742 — all `[TabSystem]` or tab-system-related. Close as "won't fix" (feature removed).

---

### Task 1: Delete all tab-only files

**Files:**
- Delete: `apps/web/src/hooks/use-tab-store.ts`
- Delete: `apps/web/src/hooks/use-tab-title.ts`
- Delete: `apps/web/src/layout/dashboard/ui/tab-bar.tsx`
- Delete: `apps/web/src/layout/dashboard/ui/tab-item.tsx`
- Delete: `apps/web/src/layout/dashboard/hooks/use-tab-router-sync.ts`
- Delete: `apps/web/src/layout/dashboard/hooks/use-tab-keyboard-shortcuts.ts`
- Delete: `apps/web/src/layout/dashboard/utils/route-to-tab.ts`

**Step 1: Delete the files**

```bash
rm apps/web/src/hooks/use-tab-store.ts
rm apps/web/src/hooks/use-tab-title.ts
rm apps/web/src/layout/dashboard/ui/tab-bar.tsx
rm apps/web/src/layout/dashboard/ui/tab-item.tsx
rm apps/web/src/layout/dashboard/hooks/use-tab-router-sync.ts
rm apps/web/src/layout/dashboard/hooks/use-tab-keyboard-shortcuts.ts
rm apps/web/src/layout/dashboard/utils/route-to-tab.ts
```

---

### Task 2: Clean `dashboard-layout.tsx`

**File:** `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`

**Step 1: Remove these 3 import lines**

```typescript
// DELETE these lines:
import { useTabKeyboardShortcuts } from "../hooks/use-tab-keyboard-shortcuts";
import { useTabRouterSync } from "../hooks/use-tab-router-sync";
import { TabBar } from "./tab-bar";
```

**Step 2: Remove the tab system section + variable declarations (lines 86–101)**

```typescript
// DELETE this entire block:
// ── Tab system ───────────────────────────────────────────────────────────

const homeRoute = `/${orgSlug}/${teamId}/home`;
const homeParams = { slug: orgSlug, teamId };

const { navigateToTab, handleCloseTab, openNewSearchTab } = useTabRouterSync(
   orgSlug,
   teamId,
);

useTabKeyboardShortcuts({
   onNewTab: openNewSearchTab,
   onTabFocus: navigateToTab,
   homeRoute,
   homeParams,
});
```

**Step 3: Remove the `<TabBar>` render block (lines 188–194)**

```tsx
// DELETE this block:
<div className="shrink-0">
   <TabBar
      onNewTab={openNewSearchTab}
      onTabClose={handleCloseTab}
      onTabFocus={navigateToTab}
   />
</div>
```

**Step 4: After editing, also remove now-unused variables**

The variables `orgSlug` and `teamId` are still used by the remaining `useEffect` (PostHog group identification). Check if they're still needed — they are, keep them.

**Expected result:** No tab imports, no tab hooks called, no `<TabBar>` in JSX.

---

### Task 3: Clean `sidebar-nav.tsx`

**File:** `apps/web/src/layout/dashboard/ui/sidebar-nav.tsx`

**Step 1: Remove the tab imports (line 23)**

```typescript
// DELETE this line:
import { replaceCurrentTab, tabStore } from "@/hooks/use-tab-store";
```

**Step 2: Simplify `handleSearch` — remove tab logic, keep navigate**

Current:
```typescript
const handleSearch = useCallback(() => {
   const route = "/$slug/$teamSlug/search";
   const searchParams = { slug: resolvedSlug, teamSlug: teamSlug ?? "" };

   if (tabStore.state.activeTabId) {
      replaceCurrentTab({
         route,
         params: searchParams,
         label: "Pesquisar",
         icon: "Search",
         type: "search",
      });
   }

   navigate({ to: route, params: searchParams });
}, [navigate, resolvedSlug, teamSlug]);
```

Replace with:
```typescript
const handleSearch = useCallback(() => {
   navigate({
      to: "/$slug/$teamSlug/search",
      params: { slug: resolvedSlug, teamSlug: teamSlug ?? "" },
   });
}, [navigate, resolvedSlug, teamSlug]);
```

---

### Task 4: Clean `search-page.tsx`

**File:** `apps/web/src/features/search/ui/search-page.tsx`

**Step 1: Remove tab-related imports (lines 21–22)**

```typescript
// DELETE these lines:
import { replaceCurrentTab } from "@/hooks/use-tab-store";
import { resolveTabMetadata } from "@/layout/dashboard/utils/route-to-tab";
```

**Step 2: Simplify `navigateToResult` — remove tab replacement**

Current:
```typescript
const navigateToResult = useCallback(
   (item: SearchResultItem) => {
      const { pathname: resolvedPath } = router.buildLocation({
         to: item.route,
         params: item.params,
      });
      const metadata = resolveTabMetadata(resolvedPath, item.params);
      replaceCurrentTab({
         route: item.route,
         params: item.params,
         label: item.title,
         icon: metadata.icon,
         type: metadata.type,
      });

      navigate({ to: item.route, params: item.params });
   },
   [navigate, router],
);
```

Replace with:
```typescript
const navigateToResult = useCallback(
   (item: SearchResultItem) => {
      navigate({ to: item.route, params: item.params });
   },
   [navigate],
);
```

**Step 3: Remove now-unused `router` variable**

The `const router = useRouter()` on line 83 is no longer used after the simplification. Remove it.

---

### Task 5: Clean `use-search.ts`

**File:** `apps/web/src/features/search/hooks/use-search.ts`

**Step 1: Remove `TabType` import (line 3)**

```typescript
// DELETE this line:
import type { TabType } from "@/hooks/use-tab-store";
```

**Step 2: Remove `tabType` field from `SearchResultItem` type (lines 13–14)**

```typescript
// In SearchResultItem type, DELETE this field:
tabType: TabType;
```

**Step 3: Remove `tabType` from every `.map()` that builds `SearchResultItem`**

There are 4 map calls (content, dashboard, insight, form). Remove `tabType: "..." as const` from each. Example:

```typescript
// Content — remove:
tabType: "content-editor" as const,

// Dashboard — remove:
tabType: "dashboard" as const,

// Insight — remove:
tabType: "insight" as const,

// Form — remove:
tabType: "form" as const,
```

---

### Task 6: Verify typecheck passes

**Step 1: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors referencing tab system files or types.

If errors appear, they will point to any missed usages — fix each one.

---

### Task 7: Commit

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(layout): remove browser-like global tab system

Removes TabBar, TabItem, useTabStore, useTabTitle, useTabRouterSync,
useTabKeyboardShortcuts, and route-to-tab utilities entirely.
Simplifies sidebar search handler and search page navigation to plain
router calls. Cleans up SearchResultItem type (removes tabType field).

Users navigate via sidebar links and browser tabs instead.
EOF
)"
```

---

### Task 8: Close GitHub issues

Close all open `[TabSystem]` issues as won't fix — the feature is removed.

```bash
gh issue close 719 --comment "Removido: o sistema de tabs global foi eliminado do layout. Usar navegação via sidebar e abas do browser."
gh issue close 720 --comment "Removido: o sistema de tabs global foi eliminado do layout."
gh issue close 722 --comment "Removido: o sistema de tabs global foi eliminado do layout."
gh issue close 723 --comment "Removido: o sistema de tabs global foi eliminado do layout."
gh issue close 724 --comment "Removido: o sistema de tabs global foi eliminado do layout."
gh issue close 726 --comment "Removido: o sistema de tabs global foi eliminado do layout."
gh issue close 742 --comment "Removido: o sistema de tabs global foi eliminado do layout."
```
