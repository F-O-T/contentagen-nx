# SSR-Safe Hooks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace SSR-unsafe `@uidotdev/usehooks` hooks (`useMediaQuery`, `useLocalStorage`) with minimal in-project wrappers that return stable server-safe values, eliminating hydration mismatches.

**Architecture:** Create two small hook files — `useSafeMediaQuery` in `packages/ui` and `useSafeLocalStorage` in `apps/web` — then update all 7 call sites. The safe versions start with a `false`/initial-value default on the server, then update synchronously on client mount via `useIsomorphicLayoutEffect` (from `@dnd-kit/utilities`). Using `useIsomorphicLayoutEffect` instead of `useEffect` eliminates the flash between SSR and client values by running synchronously during the layout phase on the client.

**Tech Stack:** React 19, TanStack Router (with `ClientOnly`), `@uidotdev/usehooks` (kept for safe hooks: `useDebounce`, `useCopyToClipboard`)

---

## Context

### Why these hooks are unsafe

| Hook | Problem | Files affected |
|------|---------|----------------|
| `useMediaQuery` | Calls `window.matchMedia` during render | `use-mobile.ts`, `credenza.tsx`, `use-standalone.ts` |
| `useLocalStorage` | Reads `localStorage` during render | `use-early-access.tsx`, `use-last-organization.ts`, `dashboard-layout.tsx`, `quick-start-checklist.tsx` |

### Safe hooks we are NOT touching
- `useDebounce` — pure JS (setTimeout), no browser APIs
- `useCopyToClipboard` — only called in event handlers (onClick), never during render
- `useIsClient` — only used in `use-standalone.ts`; will be removed when we replace `useMediaQuery` there

### Package export path for new hook
`packages/ui/src/hooks/*.ts` is already exported via `"./hooks/*"` wildcard in `packages/ui/package.json`. New hook will be importable as `@packages/ui/hooks/use-media-query`.

---

## Task 1: Create `useSafeMediaQuery`

**Files:**
- Create: `packages/ui/src/hooks/use-media-query.ts`

### Step 1: Write the file

```typescript
import { useIsomorphicLayoutEffect } from "@dnd-kit/utilities";
import { useState } from "react";

/**
 * SSR-safe replacement for useMediaQuery.
 * Returns `false` on the server and during the first client render,
 * then updates synchronously on client mount via useIsomorphicLayoutEffect.
 */
export function useSafeMediaQuery(query: string): boolean {
   const [matches, setMatches] = useState(false);

   useIsomorphicLayoutEffect(() => {
      const media = window.matchMedia(query);
      setMatches(media.matches);

      const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
   }, [query]);

   return matches;
}
```

### Step 2: Verify typecheck passes
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -50
```
Expected: no errors for the new file.

### Step 3: Commit
```bash
git add packages/ui/src/hooks/use-media-query.ts
git commit -m "feat(ui): add SSR-safe useSafeMediaQuery hook"
```

---

## Task 2: Create `useSafeLocalStorage`

**Files:**
- Create: `apps/web/src/hooks/use-local-storage.ts`

### Step 1: Write the file

```typescript
import { useIsomorphicLayoutEffect } from "@dnd-kit/utilities";
import { useCallback, useState } from "react";

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

/**
 * SSR-safe replacement for useLocalStorage.
 * Returns initialValue on the server and during the first client render,
 * then syncs with localStorage synchronously on client mount via
 * useIsomorphicLayoutEffect (prevents flash between server and real value).
 */
export function useSafeLocalStorage<T>(
   key: string,
   initialValue: T,
): [T, SetValue<T>] {
   const [storedValue, setStoredValue] = useState<T>(initialValue);

   useIsomorphicLayoutEffect(() => {
      try {
         const item = window.localStorage.getItem(key);
         if (item !== null) {
            setStoredValue(JSON.parse(item) as T);
         }
      } catch {
         // localStorage unavailable or corrupt — keep initialValue
      }
   }, [key]);

   const setValue: SetValue<T> = useCallback(
      (value) => {
         setStoredValue((prev) => {
            const next =
               typeof value === "function"
                  ? (value as (p: T) => T)(prev)
                  : value;
            try {
               window.localStorage.setItem(key, JSON.stringify(next));
            } catch {
               // localStorage unavailable — state still updates in memory
            }
            return next;
         });
      },
      [key],
   );

   return [storedValue, setValue];
}
```

### Step 2: Verify typecheck passes
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | head -50
```
Expected: no errors for the new file.

### Step 3: Commit
```bash
git add apps/web/src/hooks/use-local-storage.ts
git commit -m "feat(web): add SSR-safe useSafeLocalStorage hook"
```

---

## Task 3: Fix `packages/ui/src/hooks/use-mobile.ts`

**Files:**
- Modify: `packages/ui/src/hooks/use-mobile.ts`

Current content:
```typescript
import { useMediaQuery } from "@uidotdev/usehooks";

export function useIsMobile() {
   return useMediaQuery("(max-width: 767px)");
}
```

### Step 1: Replace import and hook call

New content:
```typescript
import { useSafeMediaQuery } from "@packages/ui/hooks/use-media-query";

export function useIsMobile() {
   return useSafeMediaQuery("(max-width: 767px)");
}
```

### Step 2: Typecheck
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "use-mobile" | head -20
```
Expected: no errors.

### Step 3: Commit
```bash
git add packages/ui/src/hooks/use-mobile.ts
git commit -m "fix(ui): make useIsMobile SSR-safe"
```

---

## Task 4: Fix `packages/ui/src/components/credenza.tsx`

**Files:**
- Modify: `packages/ui/src/components/credenza.tsx`

`Credenza` uses `(min-width: 768px)` to decide desktop vs mobile — this is exactly the inverse of `useIsMobile()`. Use that instead of calling `useSafeMediaQuery` directly.

### Step 1: Replace the import

Change line 21:
```typescript
// Before
import { useMediaQuery } from "@uidotdev/usehooks";

// After
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
```

Change line 54:
```typescript
// Before
const isDesktop = useMediaQuery("(min-width: 768px)");

// After
const isMobile = useIsMobile();
const isDesktop = !isMobile;
```

### Step 2: Typecheck
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "credenza" | head -20
```
Expected: no errors.

### Step 3: Commit
```bash
git add packages/ui/src/components/credenza.tsx
git commit -m "fix(ui): make Credenza SSR-safe via useIsMobile"
```

---

## Task 5: Fix `apps/web/src/hooks/use-standalone.ts`

**Files:**
- Modify: `apps/web/src/hooks/use-standalone.ts`

Current content:
```typescript
import { useIsClient, useMediaQuery } from "@uidotdev/usehooks";

export function useIsStandalone() {
   const isClient = useIsClient();
   const isStandaloneMedia = useMediaQuery("(display-mode: standalone)");
   const isWindowControlsOverlay = useMediaQuery(
      "(display-mode: window-controls-overlay)",
   );
   const isIOSStandalone =
      isClient &&
      (typeof navigator !== "undefined" &&
         (navigator as unknown as { standalone?: boolean }).standalone === true);
   return isIOSStandalone || isStandaloneMedia || isWindowControlsOverlay;
}
```

### Step 1: Replace with SSR-safe version

`useSafeMediaQuery` already returns `false` on server (same as `isClient = false`), so `useIsClient` is no longer needed. The `navigator.standalone` check must stay guarded because it still runs on server — use `useEffect` pattern instead via the existing `useSafeMediaQuery` returning `false` on server:

New content:
```typescript
import { useIsomorphicLayoutEffect } from "@dnd-kit/utilities";
import { useSafeMediaQuery } from "@packages/ui/hooks/use-media-query";
import { useState } from "react";

export function useIsStandalone() {
   const isStandaloneMedia = useSafeMediaQuery("(display-mode: standalone)");
   const isWindowControlsOverlay = useSafeMediaQuery(
      "(display-mode: window-controls-overlay)",
   );
   const [isIOSStandalone, setIsIOSStandalone] = useState(false);

   useIsomorphicLayoutEffect(() => {
      setIsIOSStandalone(
         (navigator as unknown as { standalone?: boolean }).standalone === true,
      );
   }, []);

   return isIOSStandalone || isStandaloneMedia || isWindowControlsOverlay;
}
```

### Step 2: Typecheck
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "use-standalone" | head -20
```
Expected: no errors.

### Step 3: Commit
```bash
git add apps/web/src/hooks/use-standalone.ts
git commit -m "fix(web): make useIsStandalone SSR-safe"
```

---

## Task 6: Fix `apps/web/src/hooks/use-early-access.tsx`

**Files:**
- Modify: `apps/web/src/hooks/use-early-access.tsx`

### Step 1: Replace import

Change line 2:
```typescript
// Before
import { useLocalStorage } from "@uidotdev/usehooks";

// After
import { useSafeLocalStorage } from "@/hooks/use-local-storage";
```

Change line 29:
```typescript
// Before
const [dismissedFlags, setDismissedFlagsState] = useLocalStorage<string[]>(

// After
const [dismissedFlags, setDismissedFlagsState] = useSafeLocalStorage<string[]>(
```

(The rest of the function is unchanged — the API is identical.)

### Step 2: Typecheck
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "use-early-access" | head -20
```
Expected: no errors.

### Step 3: Commit
```bash
git add apps/web/src/hooks/use-early-access.tsx
git commit -m "fix(web): make useEarlyAccess SSR-safe"
```

---

## Task 7: Fix `apps/web/src/hooks/use-last-organization.ts`

**Files:**
- Modify: `apps/web/src/hooks/use-last-organization.ts`

### Step 1: Replace import and hook

New content:
```typescript
import { useSafeLocalStorage } from "@/hooks/use-local-storage";

const STORAGE_KEY = "contentta:last-organization-slug";

export function useLastOrganization() {
   const [lastSlug, setLastSlug] = useSafeLocalStorage<string | null>(
      STORAGE_KEY,
      null,
   );
   return {
      lastSlug,
      setLastSlug: (slug: string) => setLastSlug(slug),
   };
}
```

### Step 2: Typecheck
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "use-last-organization" | head -20
```
Expected: no errors.

### Step 3: Commit
```bash
git add apps/web/src/hooks/use-last-organization.ts
git commit -m "fix(web): make useLastOrganization SSR-safe"
```

---

## Task 8: Fix `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`

### Step 1: Replace import

Change line 9:
```typescript
// Before
import { useLocalStorage } from "@uidotdev/usehooks";

// After
import { useSafeLocalStorage } from "@/hooks/use-local-storage";
```

Change line 36:
```typescript
// Before
const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>(

// After
const [sidebarCollapsed, setSidebarCollapsed] = useSafeLocalStorage<boolean>(
```

### Step 2: Typecheck
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "dashboard-layout" | head -20
```
Expected: no errors.

### Step 3: Commit
```bash
git add apps/web/src/layout/dashboard/ui/dashboard-layout.tsx
git commit -m "fix(web): make DashboardLayout sidebar state SSR-safe"
```

---

## Task 9: Fix `apps/web/src/features/onboarding/ui/quick-start-checklist.tsx`

**Files:**
- Modify: `apps/web/src/features/onboarding/ui/quick-start-checklist.tsx`

### Step 1: Replace import

Change line 10:
```typescript
// Before
import { useLocalStorage } from "@uidotdev/usehooks";

// After
import { useSafeLocalStorage } from "@/hooks/use-local-storage";
```

Change line 37:
```typescript
// Before
const [hiddenBySlug, setHiddenBySlug] = useLocalStorage<

// After
const [hiddenBySlug, setHiddenBySlug] = useSafeLocalStorage<
```

### Step 2: Typecheck
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | grep "quick-start-checklist" | head -20
```
Expected: no errors.

### Step 3: Commit
```bash
git add apps/web/src/features/onboarding/ui/quick-start-checklist.tsx
git commit -m "fix(web): make QuickStartChecklist localStorage SSR-safe"
```

---

## Task 10: Full typecheck + verify no remaining SSR-unsafe hook usage

### Step 1: Full typecheck
```bash
cd /home/yorizel/Documents/contentta-nx && bun run typecheck 2>&1 | tail -20
```
Expected: no errors.

### Step 2: Verify no more `useMediaQuery` or `useLocalStorage` imports from `@uidotdev/usehooks`
```bash
grep -r "useMediaQuery\|useLocalStorage" /home/yorizel/Documents/contentta-nx/apps/web/src /home/yorizel/Documents/contentta-nx/packages/ui/src --include="*.ts" --include="*.tsx" | grep "@uidotdev/usehooks"
```
Expected: no output (zero matches).

### Step 3: Verify safe hooks are used in all 9 expected files
```bash
grep -r "useSafeMediaQuery\|useSafeLocalStorage" /home/yorizel/Documents/contentta-nx/apps/web/src /home/yorizel/Documents/contentta-nx/packages/ui/src --include="*.ts" --include="*.tsx" -l
```
Expected: 7 files listed (use-mobile.ts, credenza.tsx, use-standalone.ts, use-early-access.tsx, use-last-organization.ts, dashboard-layout.tsx, quick-start-checklist.tsx).

### Step 4: Commit verification result (no changes needed)
If all clean, no commit needed. If issues found, fix them before marking done.

---

## Notes

- `useDebounce` (in emoji-node.tsx, use-insight-config.ts, etc.) is SSR-safe — pure JS timing. No changes needed.
- `useCopyToClipboard` is only called in `onClick` handlers, never during render. No SSR issue. No changes needed.
- `emoji-node.tsx` already has `"use client"` directive — doubly safe.
- `useIsomorphicLayoutEffect` (from `@dnd-kit/utilities`) runs as `useLayoutEffect` on the client (synchronous, before paint) and falls back to `useEffect` on the server. This eliminates the flash between SSR default values and real browser values.
- The `useSafeMediaQuery` returns `false` during SSR and on initial client paint, then updates synchronously before the first paint on the client.
- **Pattern rule for `useMediaQuery` replacements:**
  - If the query is a viewport width check (mobile/desktop breakpoint) → use `useIsMobile()` — single source of truth for the `767px` breakpoint.
  - If the query is something else (PWA display-mode, prefers-color-scheme, etc.) → use `useSafeMediaQuery` directly.
  - `credenza.tsx` uses `(min-width: 768px)` = inverse of `useIsMobile()` → `const isDesktop = !useIsMobile()`.
  - `use-standalone.ts` uses `(display-mode: standalone)` / `(display-mode: window-controls-overlay)` — these are NOT mobile breakpoints → keep `useSafeMediaQuery` directly.
- Server renders mobile-false (desktop) first:
  - `useIsMobile()` → `false` on server → desktop layout first → correct for most SSR use cases.
  - `Credenza` → `isDesktop = true` on server → Dialog rendered first → flips to Drawer on client if viewport < 768px. Minor flash on mobile, eliminates crash/mismatch.
- If the flash is unacceptable for `Credenza`, wrapping it in `<ClientOnly>` from `@tanstack/react-router` is the alternative — but this is not needed for correctness.
