# Early Access Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gate beta features (starting with Forms) behind PostHog Early Access, with sidebar/search filtering, Beta badges, and a discovery banner.

**Architecture:** `useEarlyAccessFeatures()` from `@packages/posthog/client` is the single source of truth. Sidebar nav items declare an optional `earlyAccessFlag` field. Components consuming nav items filter and badge based on enrollment state. A shared React context avoids multiple hook calls.

**Tech Stack:** PostHog Early Access API, React Context, localStorage, existing `@packages/ui` Badge/Separator components.

---

### Task 1: Early Access Context Provider

**Files:**
- Create: `apps/web/src/hooks/use-early-access.tsx`

**Step 1: Create the context provider**

This context wraps `useEarlyAccessFeatures()` so multiple consumers (sidebar, search, banner, settings) share one hook call. It also manages banner dismissal state.

```tsx
import { useEarlyAccessFeatures } from "@packages/posthog/client";
import {
   type ReactNode,
   createContext,
   useCallback,
   useContext,
   useMemo,
   useState,
} from "react";

type EarlyAccessContextValue = {
   /** Whether PostHog has loaded features */
   loaded: boolean;
   /** Set of enrolled flag keys */
   enrolledFeatures: Set<string>;
   /** All available early access features from PostHog */
   features: ReturnType<typeof useEarlyAccessFeatures>["features"];
   /** Check if a specific flag key is enrolled */
   isEnrolled: (flagKey: string) => boolean;
   /** Toggle enrollment for a flag key */
   updateEnrollment: (flagKey: string, isEnrolled: boolean) => void;
   /** Whether the sidebar banner should be visible */
   isBannerVisible: boolean;
   /** Dismiss the banner (persists to localStorage) */
   dismissBanner: () => void;
};

const BANNER_DISMISSED_KEY = "contentta:early-access-banner-dismissed";

function getDismissedFlags(): string[] {
   try {
      const stored = localStorage.getItem(BANNER_DISMISSED_KEY);
      return stored ? JSON.parse(stored) : [];
   } catch {
      return [];
   }
}

function setDismissedFlags(flags: string[]) {
   try {
      localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(flags));
   } catch {
      // Silent fail on quota/unavailability
   }
}

const EarlyAccessContext = createContext<EarlyAccessContextValue | null>(null);

export function EarlyAccessProvider({ children }: { children: ReactNode }) {
   const {
      features,
      enrolledFeatures,
      loaded,
      isEnrolled,
      updateEnrollment,
   } = useEarlyAccessFeatures();

   const [dismissedFlags, setDismissedFlagsState] = useState<string[]>(
      getDismissedFlags,
   );

   const isBannerVisible = useMemo(() => {
      if (!loaded || features.length === 0) return false;
      // Show banner if there are unenrolled features not yet dismissed
      const dismissedSet = new Set(dismissedFlags);
      return features.some(
         (f) =>
            f.flagKey &&
            !enrolledFeatures.has(f.flagKey) &&
            !dismissedSet.has(f.flagKey),
      );
   }, [loaded, features, enrolledFeatures, dismissedFlags]);

   const dismissBanner = useCallback(() => {
      const allFlagKeys = features
         .map((f) => f.flagKey)
         .filter((k): k is string => k !== null);
      setDismissedFlagsState(allFlagKeys);
      setDismissedFlags(allFlagKeys);
   }, [features]);

   const value = useMemo<EarlyAccessContextValue>(
      () => ({
         loaded,
         enrolledFeatures,
         features,
         isEnrolled,
         updateEnrollment,
         isBannerVisible,
         dismissBanner,
      }),
      [
         loaded,
         enrolledFeatures,
         features,
         isEnrolled,
         updateEnrollment,
         isBannerVisible,
         dismissBanner,
      ],
   );

   return (
      <EarlyAccessContext.Provider value={value}>
         {children}
      </EarlyAccessContext.Provider>
   );
}

export function useEarlyAccess() {
   const ctx = useContext(EarlyAccessContext);
   if (!ctx) {
      throw new Error("useEarlyAccess must be used within EarlyAccessProvider");
   }
   return ctx;
}
```

**Step 2: Mount the provider**

Find the dashboard layout that wraps authenticated routes (likely `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard.tsx` or the layout that renders `AppSidebar`). Wrap the children with `<EarlyAccessProvider>`.

Look at the route tree to find the correct layout file and add:

```tsx
import { EarlyAccessProvider } from "@/hooks/use-early-access";

// Inside the component's return, wrap existing content:
<EarlyAccessProvider>
   {/* existing layout content */}
</EarlyAccessProvider>
```

**Step 3: Verify it compiles**

Run: `bunx nx typecheck web`
Expected: No new type errors

**Step 4: Commit**

```bash
git add apps/web/src/hooks/use-early-access.tsx apps/web/src/routes/_authenticated/...layout-file
git commit -m "feat: add EarlyAccessProvider context for PostHog early access features"
```

---

### Task 2: Add `earlyAccessFlag` to Sidebar Nav Items

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts`

**Step 1: Add the optional field to `NavItemDef`**

```typescript
export type NavItemDef = {
   id: string;
   label: string;
   icon: LucideIcon;
   route: string;
   quickAction?: NavItemAction;
   subPanel?: SubSidebarSection;
   /** PostHog early access flag key — if set, item is hidden when user is not enrolled */
   earlyAccessFlag?: string;
};
```

**Step 2: Set `earlyAccessFlag` on the Forms item**

In the `navGroups` array, add `earlyAccessFlag: "forms-beta"` to the Forms item (id: `"forms"`, around line 56-61):

```typescript
{
   id: "forms",
   label: "Formularios",
   icon: ClipboardList,
   route: "/$slug/$teamId/forms",
   quickAction: { type: "create", target: "navigate" },
   earlyAccessFlag: "forms-beta",
},
```

**Step 3: Verify it compiles**

Run: `bunx nx typecheck web`
Expected: No type errors

**Step 4: Commit**

```bash
git add apps/web/src/layout/dashboard/ui/sidebar-nav-items.ts
git commit -m "feat: add earlyAccessFlag field to NavItemDef, set forms-beta on Forms"
```

---

### Task 3: Filter Sidebar Items + Beta Badge

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/sidebar-nav.tsx`

**Step 1: Filter items by enrollment and add Beta badge**

Import `useEarlyAccess` and `Badge`. In the `NavGroup` component, filter `group.items` to exclude unenrolled early access items. In the `NavItem` component, render a Badge when the item has `earlyAccessFlag`.

At the top, add imports:

```typescript
import { Badge } from "@packages/ui/components/badge";
import { useEarlyAccess } from "@/hooks/use-early-access";
```

In `NavGroup`, filter items:

```typescript
function NavGroup({ group, slug, teamId, isItemActive, onSubPanelToggle, onMainItemClick }: { ... }) {
   const { isEnrolled } = useEarlyAccess();

   const visibleItems = group.items.filter((item) => {
      if (!item.earlyAccessFlag) return true;
      return isEnrolled(item.earlyAccessFlag);
   });

   if (visibleItems.length === 0) return null;

   return (
      <SidebarGroup>
         <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
         <SidebarGroupContent>
            <SidebarMenu>
               {visibleItems.map((item) => (
                  <NavItem
                     isActive={isItemActive(item)}
                     item={item}
                     key={item.id}
                     onMainItemClick={onMainItemClick}
                     onSubPanelToggle={onSubPanelToggle}
                     slug={slug}
                     teamId={teamId}
                  />
               ))}
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}
```

In the `NavItem` component, add the Beta badge next to the label. For both the sub-panel branch and the Link branch, after `<span>{item.label}</span>`, add:

```tsx
{item.earlyAccessFlag && (
   <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] leading-4 group-data-[collapsible=icon]:hidden">
      Beta
   </Badge>
)}
```

**Step 2: Verify it compiles**

Run: `bunx nx typecheck web`

**Step 3: Commit**

```bash
git add apps/web/src/layout/dashboard/ui/sidebar-nav.tsx
git commit -m "feat: filter sidebar items by early access enrollment, add Beta badge"
```

---

### Task 4: Early Access Sidebar Banner

**Files:**
- Create: `apps/web/src/layout/dashboard/ui/early-access-sidebar-banner.tsx`
- Modify: `apps/web/src/layout/dashboard/ui/app-sidebar.tsx`

**Step 1: Create the banner component**

```tsx
import { Separator } from "@packages/ui/components/separator";
import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { Link, useParams } from "@tanstack/react-router";
import { FlaskConical, X } from "lucide-react";
import { useEarlyAccess } from "@/hooks/use-early-access";

export function EarlyAccessSidebarBanner() {
   const { isBannerVisible, dismissBanner } = useEarlyAccess();
   const params = useParams({ strict: false }) as {
      slug?: string;
      teamId?: string;
   };
   const slug = params.slug ?? "";
   const teamId = params.teamId ?? "";

   if (!isBannerVisible) return null;

   return (
      <>
         <Separator className="mx-2 w-auto" />
         <SidebarGroup className="py-2">
            <SidebarGroupContent>
               {/* Expanded view */}
               <div className="group-data-[collapsible=icon]:hidden rounded-md border border-border/50 bg-muted/50 p-3 mx-2">
                  <div className="flex items-start justify-between gap-2">
                     <div className="flex items-center gap-2">
                        <FlaskConical className="size-4 shrink-0 text-primary" />
                        <span className="text-xs font-medium">
                           Funcionalidades em Beta
                        </span>
                     </div>
                     <button
                        className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={dismissBanner}
                        type="button"
                     >
                        <X className="size-3" />
                     </button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                     Experimente recursos antes de todo mundo.
                  </p>
                  <Link
                     className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                     params={{ slug, teamId }}
                     to="/$slug/$teamId/settings/feature-previews"
                  >
                     Ver funcionalidades
                  </Link>
               </div>

               {/* Collapsed (icon-only) view */}
               <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
                  <SidebarMenuItem>
                     <SidebarMenuButton asChild tooltip="Funcionalidades em Beta">
                        <Link
                           params={{ slug, teamId }}
                           to="/$slug/$teamId/settings/feature-previews"
                        >
                           <FlaskConical />
                           <span>Beta</span>
                        </Link>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               </SidebarMenu>
            </SidebarGroupContent>
         </SidebarGroup>
      </>
   );
}
```

**Step 2: Mount the banner in `app-sidebar.tsx`**

In `AppSidebar`, add the banner between `SidebarContent` and `SidebarFooter`:

```tsx
import { EarlyAccessSidebarBanner } from "./early-access-sidebar-banner";

// Inside AppSidebar return:
<SidebarContent>
   <SidebarSearchButton />
   <SidebarNav />
   <EarlyAccessSidebarBanner />
</SidebarContent>
```

The banner goes at the bottom of `SidebarContent` (above the footer), which naturally pushes it toward the bottom with a spacer or flex.

**Step 3: Verify it compiles**

Run: `bunx nx typecheck web`

**Step 4: Commit**

```bash
git add apps/web/src/layout/dashboard/ui/early-access-sidebar-banner.tsx apps/web/src/layout/dashboard/ui/app-sidebar.tsx
git commit -m "feat: add early access discovery banner to sidebar"
```

---

### Task 5: Wire Feature Previews Settings Page to PostHog

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/feature-previews.tsx`

**Step 1: Replace hardcoded list with PostHog data**

Replace the entire component to use `useEarlyAccess()`:

```tsx
import { Badge } from "@packages/ui/components/badge";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Switch } from "@packages/ui/components/switch";
import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { useEarlyAccess } from "@/hooks/use-early-access";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/feature-previews",
)({
   component: FeaturePreviewsPage,
});

const STAGE_LABELS: Record<string, string> = {
   alpha: "Alpha",
   beta: "Beta",
   concept: "Conceito",
};

function FeaturePreviewsPage() {
   const { features, loaded, isEnrolled, updateEnrollment } = useEarlyAccess();

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Previas de Funcionalidades
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Experimente funcionalidades em fase beta antes do lancamento
               oficial.
            </p>
         </div>
         {!loaded && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
         )}
         {loaded && features.length === 0 && (
            <p className="text-sm text-muted-foreground">
               Nenhuma funcionalidade em beta disponivel no momento.
            </p>
         )}
         {loaded && features.length > 0 && (
            <ItemGroup>
               {features.map((feature) => {
                  if (!feature.flagKey) return null;
                  const enrolled = isEnrolled(feature.flagKey);
                  return (
                     <Item key={feature.flagKey} variant="muted">
                        <ItemMedia variant="icon">
                           <FlaskConical className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <div className="flex items-center gap-2">
                              <ItemTitle>{feature.name}</ItemTitle>
                              <Badge variant="secondary" className="text-xs">
                                 <FlaskConical className="size-3 mr-1" />
                                 {STAGE_LABELS[feature.stage] ?? feature.stage}
                              </Badge>
                           </div>
                           <ItemDescription>
                              {feature.description}
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <Switch
                              checked={enrolled}
                              onCheckedChange={(checked) =>
                                 updateEnrollment(feature.flagKey!, checked)
                              }
                           />
                        </ItemActions>
                     </Item>
                  );
               })}
            </ItemGroup>
         )}
      </div>
   );
}
```

**Step 2: Verify it compiles**

Run: `bunx nx typecheck web`

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/feature-previews.tsx
git commit -m "feat: wire feature previews settings page to PostHog early access API"
```

---

### Task 6: Filter Search Results by Enrollment

**Files:**
- Modify: `apps/web/src/features/search/hooks/use-search.ts`
- Modify: `apps/web/src/features/search/ui/search-page.tsx`

**Step 1: Add `earlyAccessFlag` to `SearchResultType` filtering**

In `use-search.ts`, add an optional `hiddenTypes` parameter to `useSearch`:

```typescript
export function useSearch(
   orgSlug: string,
   teamId: string,
   options?: { hiddenTypes?: Set<SearchResultType> },
) {
```

Then at the end of the `search` callback, before returning `groups`, filter out hidden types:

```typescript
if (options?.hiddenTypes && options.hiddenTypes.size > 0) {
   return groups.filter((g) => !options.hiddenTypes!.has(g.type));
}
return groups;
```

**Step 2: In `search-page.tsx`, compute hidden types from enrollment**

Import `useEarlyAccess` and define the mapping from `earlyAccessFlag` to `SearchResultType`:

```typescript
import { useEarlyAccess } from "@/hooks/use-early-access";

const EARLY_ACCESS_SEARCH_MAP: Record<string, SearchResultType> = {
   "forms-beta": "form",
};
```

In `SearchPage`, compute hidden types:

```typescript
const { isEnrolled, loaded: earlyAccessLoaded } = useEarlyAccess();

const hiddenSearchTypes = useMemo(() => {
   const hidden = new Set<SearchResultType>();
   for (const [flagKey, resultType] of Object.entries(EARLY_ACCESS_SEARCH_MAP)) {
      if (!isEnrolled(flagKey)) {
         hidden.add(resultType);
      }
   }
   return hidden;
}, [isEnrolled]);

const { query, setQuery, results, hasResults, hasQuery } = useSearch(
   params.slug,
   params.teamId,
   { hiddenTypes: hiddenSearchTypes },
);
```

Also filter the quick actions:

```typescript
const quickActions = useMemo(() => {
   const actions = getQuickActions(params.slug, params.teamId);
   return actions.filter((a) => {
      // Hide "Novo formulario" if forms-beta not enrolled
      if (a.route.includes("/forms") && !isEnrolled("forms-beta")) return false;
      return true;
   });
}, [params.slug, params.teamId, isEnrolled]);
```

Then use `quickActions` instead of calling `getQuickActions` directly in the render.

**Step 3: Verify it compiles**

Run: `bunx nx typecheck web`

**Step 4: Commit**

```bash
git add apps/web/src/features/search/hooks/use-search.ts apps/web/src/features/search/ui/search-page.tsx
git commit -m "feat: filter search results and quick actions by early access enrollment"
```

---

### Task 7: Manual Verification

**Step 1: Create the Early Access Feature in PostHog dashboard**

Go to PostHog > Early Access Management and create a feature linked to the `forms-beta` flag with stage "Beta". This is required for `posthog.getEarlyAccessFeatures()` to return it.

**Step 2: Start dev server**

Run: `bun dev`

**Step 3: Verify unenrolled state**

- Sidebar should NOT show "Formularios"
- Search should NOT show form results or "Novo formulario" quick action
- Early access banner should appear above sidebar footer with "Funcionalidades em Beta"

**Step 4: Enroll via settings**

- Navigate to Settings > Feature Previews
- Toggle Forms on
- Sidebar should immediately show "Formularios" with Beta badge
- Search should now include forms
- Banner should remain visible (user enrolled, but banner shows for unenrolled features)

**Step 5: Dismiss banner**

- Close the banner with X
- Refresh page — banner should stay hidden (localStorage)

**Step 6: Verify collapsed sidebar**

- Collapse sidebar
- If banner was visible, should show FlaskConical icon with tooltip

**Step 7: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "fix: early access feature adjustments from manual testing"
```
