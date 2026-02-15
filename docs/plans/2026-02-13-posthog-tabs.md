# PostHog-Style Tabs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the dashboard tabs match PostHog UX and styling: pill tabs with merged border, replace-current navigation by default, and “+” opening a new search tab only.

**Architecture:** Update the tab-router sync to replace the active tab when a route has no matching tab, while preserving explicit “new tab” creation for the + search button. Restyle the tab bar and tab items to use pill shapes, no underline, and merged border visuals using existing design tokens.

**Tech Stack:** React 19, TanStack Router, TanStack Store, Tailwind CSS, Lucide icons.

---

### Task 1: Add test coverage for tab replace-on-navigate behavior

**Files:**
- Create: `apps/web/__tests__/layout/dashboard/tab-router-sync.test.tsx`
- Modify: `apps/web/src/layout/dashboard/hooks/use-tab-router-sync.ts` (for testable exports if needed)

**Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { tabStore } from "@/hooks/use-tab-store";
import { useTabRouterSync } from "@/layout/dashboard/hooks/use-tab-router-sync";

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/org/team/forms" }),
  useParams: () => ({ slug: "org", teamId: "team" }),
  useNavigate: () => vi.fn(),
}));

describe("useTabRouterSync", () => {
  it("replaces the active tab when route has no existing tab", () => {
    tabStore.setState(() => ({
      tabs: [
        {
          id: "tab-1",
          route: "/$slug/$teamId/home",
          params: { slug: "org", teamId: "team" },
          label: "Home",
          type: "home",
          openedAt: Date.now(),
        },
      ],
      activeTabId: "tab-1",
    }));

    act(() => {
      useTabRouterSync("org", "team");
    });

    const updated = tabStore.state.tabs.find((t) => t.id === "tab-1");
    expect(updated?.route).toBe("/$slug/$teamId/forms");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test -- --runInBand apps/web/__tests__/layout/dashboard/tab-router-sync.test.tsx`
Expected: FAIL with “route not updated” or similar.

**Step 3: Write minimal implementation**

In `use-tab-router-sync.ts`, replace the “open new tab” path on unmatched routes with “replace active tab” (see Task 2 for exact code).

**Step 4: Run test to verify it passes**

Run: `bun run test -- --runInBand apps/web/__tests__/layout/dashboard/tab-router-sync.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/__tests__/layout/dashboard/tab-router-sync.test.tsx apps/web/src/layout/dashboard/hooks/use-tab-router-sync.ts
git commit -m "test: cover replace-current tab routing"
```

---

### Task 2: Change route-sync behavior to replace active tab by default

**Files:**
- Modify: `apps/web/src/layout/dashboard/hooks/use-tab-router-sync.ts:59-77`

**Step 1: Write the failing test**

Use the test from Task 1 (already failing until implementation changes).

**Step 2: Run test to verify it fails**

Run: `bun run test -- --runInBand apps/web/__tests__/layout/dashboard/tab-router-sync.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

Replace the “openTab” path with “replaceCurrentTab”, preserving the focus-if-exists logic and active-tab usage:

```ts
if (existing) {
  if (existing.id !== tabStore.state.activeTabId) {
    focusTab(existing.id);
  }
} else {
  const metadata = resolveTabMetadata(pathname, params);
  if (tabStore.state.activeTabId) {
    replaceCurrentTab({
      route: routePath,
      params: { ...params },
      label: metadata.label,
      icon: metadata.icon,
      type: metadata.type,
    });
  } else {
    openTab({
      route: routePath,
      params: { ...params },
      label: metadata.label,
      icon: metadata.icon,
      type: metadata.type,
    });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test -- --runInBand apps/web/__tests__/layout/dashboard/tab-router-sync.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/layout/dashboard/hooks/use-tab-router-sync.ts
git commit -m "feat: replace active tab on navigation"
```

---

### Task 3: Restyle tabs to PostHog pill look with merged border

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/tab-bar.tsx:109-161`
- Modify: `apps/web/src/layout/dashboard/ui/tab-item.tsx:128-166`

**Step 1: Write the failing test**

Add a simple snapshot test to verify tab classes (optional for now). If skipping tests, document manual verification steps.

```tsx
// apps/web/__tests__/layout/dashboard/tab-item.test.tsx
import { render } from "@testing-library/react";
import { TabItem } from "@/layout/dashboard/ui/tab-item";

it("renders pill-style tab classes", () => {
  const { getByRole } = render(
    <TabItem
      id="tab"
      label="Forms"
      type="form"
      isActive
      onFocus={() => null}
      onClose={() => null}
      onPin={() => null}
      onUnpin={() => null}
      onCloseOthers={() => null}
      onCloseAll={() => null}
    />,
  );
  expect(getByRole("button").className).toContain("rounded");
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test -- --runInBand apps/web/__tests__/layout/dashboard/tab-item.test.tsx`
Expected: FAIL if no rounded classes.

**Step 3: Write minimal implementation**

Update classes to remove the underline and use pills:

```tsx
// tab-item.tsx
className={cn(
  "group/tab relative flex h-8 min-w-0 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors select-none",
  isPinned && !isActive && "max-w-10",
  !isPinned && "max-w-[200px]",
  isActive
    ? "bg-background text-foreground border border-border"
    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
)}
```

Update the tab bar container to keep the merged top border and align the + button:

```tsx
// tab-bar.tsx
<div className="relative flex h-9 shrink-0 items-center border-b bg-background/50">
...
<button className="flex h-8 w-9 items-center justify-center rounded-md border-l text-muted-foreground hover:bg-muted/40" ... />
```

**Step 4: Run test to verify it passes**

Run: `bun run test -- --runInBand apps/web/__tests__/layout/dashboard/tab-item.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/layout/dashboard/ui/tab-item.tsx apps/web/src/layout/dashboard/ui/tab-bar.tsx apps/web/__tests__/layout/dashboard/tab-item.test.tsx
git commit -m "style: match PostHog tab pills"
```

---

### Task 4: Manual verification checklist (no automated tests)

**Files:**
- None (manual verification)

**Step 1: Run the app locally**

Run: `bun dev:server` and `bun dev` (or `bun dev:all` if needed)

**Step 2: Verify UX**

- Click sidebar item → current tab label/route updates, no new tab.
- Click a second tab → navigate inside it → only that tab updates.
- Click + → new Search tab opens.
- Active tab uses pill shape, no underline, merged border looks continuous.

**Step 3: Commit verification note (optional)**

Document manual verification in the PR or commit message.

---

## Notes
- Baseline tests currently fail in this repo due to missing env and mocks; plan assumes focused test runs per file.
- Use PostHog-like visuals but retain existing color tokens.
