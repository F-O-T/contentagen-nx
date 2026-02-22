# Feature Previews: localStorage Cache + Stage Badges in Settings Submenu

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cache enrolled early-access features in localStorage (avoid refetch flicker) and render `<FeatureStageBadge>` in the Settings Products submenu for enrolled features with an `earlyAccessFlag`.

**Architecture:** The `EarlyAccessProvider` in `use-early-access.tsx` wraps PostHog's `useEarlyAccessFeatures()`. We extend it to read an initial cache from localStorage on mount, sync back after PostHog loads, and optimistically write on `updateEnrollment()`. The `settings-sidebar.tsx` child-item renderer already filters by enrollment; we add stage lookup and badge rendering there. No backend or DB changes.

**Tech Stack:** React hooks, `useSafeLocalStorage`, PostHog `useEarlyAccessFeatures`, `FeatureStageBadge` from `@packages/ui`, TanStack Router (settings sidebar).

---

### Task 1: Add `earlyAccessStage` field to `SettingsNavItemDef`

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/settings-nav-items.ts`

**Step 1: Add the `earlyAccessStage` optional field to the type**

In `SettingsNavItemDef`, after `earlyAccessFlag?: string;` add:
```typescript
earlyAccessStage?: "alpha" | "beta" | "concept" | "general-availability";
```

**Step 2: Annotate the two existing items that have `earlyAccessFlag`**

`product-forms` already has `earlyAccessFlag: "forms-beta"` — the stage badge comes from PostHog at runtime, so no hard-coded stage value is needed. But `product-asset-bank` has `earlyAccessFlag: "asset-bank"`. Leave both without a hard-coded `earlyAccessStage` for now (the stage will come from the live PostHog features array in `useEarlyAccess`).

> **Note:** The `earlyAccessStage` field on the type is the extension point; the sidebar reads stage dynamically from PostHog context, not from the config. No value needs to be set in the config.

**Step 3: Verify TypeScript**

Run: `bun run typecheck`
Expected: no new errors

**Step 4: Commit**

```bash
git add apps/web/src/layout/dashboard/ui/settings-nav-items.ts
git commit -m "feat(settings-nav): add earlyAccessStage field to SettingsNavItemDef type"
```

---

### Task 2: Expose `getFeatureStage` from `useEarlyAccess`

The settings sidebar needs to look up the stage of a feature by its `flagKey`. Currently `useEarlyAccess()` does not expose a helper for this.

**Files:**
- Modify: `apps/web/src/hooks/use-early-access.tsx`

**Step 1: Add `getFeatureStage` to the context type**

In `EarlyAccessContextValue`, add:
```typescript
getFeatureStage: (flagKey: string) => "alpha" | "beta" | "concept" | "general-availability" | null;
```

**Step 2: Implement `getFeatureStage` inside `EarlyAccessProvider`**

After the `dismissBanner` callback, add:
```typescript
const getFeatureStage = useCallback(
   (flagKey: string) => {
      const feature = features.find((f) => f.flagKey === flagKey);
      return feature?.stage ?? null;
   },
   [features],
);
```

**Step 3: Include `getFeatureStage` in the context value object**

Add `getFeatureStage` to:
- The `value` object passed to `useMemo`
- The `useMemo` dependency array

**Step 4: Verify TypeScript**

Run: `bun run typecheck`
Expected: no new errors

**Step 5: Commit**

```bash
git add apps/web/src/hooks/use-early-access.tsx
git commit -m "feat(early-access): expose getFeatureStage helper from EarlyAccessContext"
```

---

### Task 3: Add localStorage cache for enrolled features

**Files:**
- Modify: `apps/web/src/hooks/use-early-access.tsx`

The goal: on mount, read `contentta:enrolled-features` from localStorage as the initial state (prevents flicker). After PostHog loads, write fresh data. On `updateEnrollment`, write optimistically.

**Data model (localStorage value):**
```typescript
type EnrolledFeaturesCache = Record<
   string,
   { enrolled: boolean; stage: "alpha" | "beta" | "concept" | "general-availability"; name: string }
>;
```

**Step 1: Add the new localStorage cache key constant**

At the top of `EarlyAccessProvider`, alongside `BANNER_DISMISSED_KEY`:
```typescript
const ENROLLED_FEATURES_CACHE_KEY = "contentta:enrolled-features";
```

**Step 2: Add the `EnrolledFeaturesCache` type**

Just above or inside the provider file, add:
```typescript
type EnrolledFeaturesCache = Record<
   string,
   { enrolled: boolean; stage: "alpha" | "beta" | "concept" | "general-availability"; name: string }
>;
```

**Step 3: Wire `useSafeLocalStorage` for the cache inside `EarlyAccessProvider`**

After the `dismissedFlags` storage hook:
```typescript
const [enrolledCache, setEnrolledCache] = useSafeLocalStorage<EnrolledFeaturesCache>(
   ENROLLED_FEATURES_CACHE_KEY,
   {},
);
```

**Step 4: Sync localStorage cache after PostHog loads**

PostHog's `loaded` + `features` + `enrolledFeatures` are already available from `useEarlyAccessFeatures()`. Add a `useEffect` that runs when `loaded` becomes true:

```typescript
useEffect(() => {
   if (!loaded) return;
   const next: EnrolledFeaturesCache = {};
   for (const feature of features) {
      if (!feature.flagKey) continue;
      next[feature.flagKey] = {
         enrolled: enrolledFeatures.has(feature.flagKey),
         stage: feature.stage,
         name: feature.name,
      };
   }
   setEnrolledCache(next);
}, [loaded, features, enrolledFeatures, setEnrolledCache]);
```

**Step 5: Patch `updateEnrollment` to write optimistically**

The current `updateEnrollment` from `useEarlyAccessFeatures()` is passed through as-is. Wrap it:

```typescript
const updateEnrollmentWithCache = useCallback(
   (flagKey: string, isEnrolledValue: boolean) => {
      updateEnrollment(flagKey, isEnrolledValue);
      // Optimistic cache update
      setEnrolledCache((prev) => {
         const existing = prev[flagKey];
         if (!existing) return prev;
         return {
            ...prev,
            [flagKey]: { ...existing, enrolled: isEnrolledValue },
         };
      });
   },
   [updateEnrollment, setEnrolledCache],
);
```

Replace `updateEnrollment` in the context `value` with `updateEnrollmentWithCache`.

**Step 6: Verify TypeScript**

Run: `bun run typecheck`
Expected: no new errors

**Step 7: Commit**

```bash
git add apps/web/src/hooks/use-early-access.tsx
git commit -m "feat(early-access): cache enrolled features in localStorage to prevent flicker"
```

---

### Task 4: Render `FeatureStageBadge` in settings sub-menu items

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/settings-sidebar.tsx`

The `NavItem` component renders `visibleChildren` inside `<SidebarMenuSubButton>`. We need to show the stage badge next to the item title when the child has an `earlyAccessFlag` and the user is enrolled.

**Step 1: Import `FeatureStageBadge`**

Add at the top of `settings-sidebar.tsx`:
```typescript
import { FeatureStageBadge } from "@packages/ui/components/feature-stage-badge";
```

**Step 2: Get `getFeatureStage` from `useEarlyAccess()`**

In the `NavItem` component body, change:
```typescript
const { isEnrolled } = useEarlyAccess();
```
to:
```typescript
const { isEnrolled, getFeatureStage } = useEarlyAccess();
```

**Step 3: Render the badge inside `SidebarMenuSubButton`**

In the `visibleChildren.map(...)` block, change:
```tsx
<Link params={{ slug, teamSlug }} to={child.href}>
   <span>{child.title}</span>
</Link>
```
to:
```tsx
<Link params={{ slug, teamSlug }} to={child.href}>
   <span>{child.title}</span>
   {child.earlyAccessFlag && isEnrolled(child.earlyAccessFlag) && (() => {
      const stage = getFeatureStage(child.earlyAccessFlag);
      if (!stage) return null;
      return (
         <FeatureStageBadge
            className="ml-auto text-[10px] px-1 py-0"
            showIcon={false}
            stage={stage}
         />
      );
   })()}
</Link>
```

> **Style note:** `text-[10px] px-1 py-0` makes the badge compact enough for the sidebar submenu without overflowing. `showIcon={false}` keeps it minimal (text-only). Adjust if design differs.

**Step 4: Verify TypeScript**

Run: `bun run typecheck`
Expected: no new errors

**Step 5: Commit**

```bash
git add apps/web/src/layout/dashboard/ui/settings-sidebar.tsx
git commit -m "feat(settings-sidebar): show FeatureStageBadge for enrolled early access product nav items"
```

---

### Task 5: Final verification

**Step 1: Run typecheck and lint**

```bash
bun run typecheck && bun run check
```

Expected: no errors

**Step 2: Manual smoke test (development server)**

1. Open the app in dev mode (`bun dev`)
2. In PostHog, ensure the test user is enrolled in at least one early-access feature (e.g., `forms-beta`)
3. Navigate to Settings → Produtos in the sidebar
4. Verify the beta/alpha badge appears next to "Formulários" (or whichever feature is enrolled)
5. Refresh the page — verify the badge appears immediately (no flicker) because the cache is loaded from localStorage
6. Open browser DevTools → Application → localStorage → `contentta:enrolled-features` — verify the JSON structure matches `{ "forms-beta": { enrolled: true, stage: "beta", name: "..." }, ... }`
7. Navigate away and back; badge should still appear instantly

**Step 3: Check the unenrolled case**

Unenroll from a feature in Feature Previews. Verify:
- The child item is hidden from the submenu (existing filter behavior)
- If somehow visible, no badge is shown

**Step 4: Commit (if any cleanup needed)**

```bash
git commit -m "chore: cleanup after feature-previews localStorage cache + stage badge implementation"
```

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `apps/web/src/layout/dashboard/ui/settings-nav-items.ts` | Add `earlyAccessStage?` field to `SettingsNavItemDef` type |
| `apps/web/src/hooks/use-early-access.tsx` | Add `getFeatureStage`, localStorage cache sync, optimistic write on `updateEnrollment` |
| `apps/web/src/layout/dashboard/ui/settings-sidebar.tsx` | Import `FeatureStageBadge`, render it in sub-menu items with `earlyAccessFlag` |

No new files created. No DB or backend changes.
