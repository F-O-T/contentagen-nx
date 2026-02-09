# Sidebar Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix icon alignment, collapse toggle, and convert all three sidebars (main, settings, floating sub-panel) to use the SidebarManager registry pattern for coordinated multi-sidebar control.

**Architecture:** All three sidebars become proper `<Sidebar>` components registered via `SidebarManager`:
- `name="main"` — the primary icon-collapsible sidebar
- `name="settings"` — settings navigation sidebar (nested `SidebarProvider` inside `SidebarInset`)
- `name="sub-panel"` — analytics floating sub-panel (nested `SidebarProvider` with `variant="floating"`)

The `SidebarManagerProvider` wraps the entire dashboard layout. Each sidebar has its own `SidebarProvider` for independent state. The TanStack Store (`use-sidebar-nav.ts`) is simplified to only track *which section* is active (dashboards vs insights) — open/close state is delegated to the sub-panel's `SidebarProvider` via the manager.

**Tech Stack:** React 19, shadcn/ui sidebar primitives, TanStack Router, TanStack Store, Tailwind CSS 4, Vitest + React Testing Library

---

## Task 1: Add SidebarManager primitives to the UI package

**Files:**
- Modify: `packages/ui/src/components/sidebar.tsx`

**Step 1: Add SidebarManager types, context, and components**

Add after the existing `SidebarContext` definition (around line 44). Add these new components:

1. `SidebarManagerContext` + `useSidebarManager()` hook — a registry of named sidebars
2. `SidebarManagerProvider` — top-level provider that holds the registry
3. `SidebarManager` — registers a sidebar with a unique name using `useSidebar()` + `useSidebarManager()`
4. `SidebarManagerTrigger` — a button to toggle a sidebar by name from anywhere

```tsx
// --- Sidebar Manager (multi-sidebar registry) ---

type SidebarRegistry = Record<string, SidebarContextProps>;

type SidebarManagerContextProps = {
   register: (name: string, context: SidebarContextProps) => void;
   unregister: (name: string) => void;
   use: (name: string) => SidebarContextProps | null;
};

const SidebarManagerContext = React.createContext<SidebarManagerContextProps | null>(null);

function useSidebarManager() {
   const context = React.useContext(SidebarManagerContext);
   if (!context) {
      throw new Error("useSidebarManager must be used within a SidebarManagerProvider.");
   }
   return context;
}

function SidebarManagerProvider({ children }: { children: React.ReactNode }) {
   const [sidebars, setSidebars] = React.useState<SidebarRegistry>({});

   const register = React.useCallback(
      (name: string, context: SidebarContextProps) => {
         setSidebars((prev) => ({ ...prev, [name]: context }));
      },
      [],
   );

   const unregister = React.useCallback((name: string) => {
      setSidebars((prev) => {
         const next = { ...prev };
         delete next[name];
         return next;
      });
   }, []);

   const use = React.useCallback(
      (name: string) => sidebars[name] ?? null,
      [sidebars],
   );

   const value = React.useMemo(
      () => ({ register, unregister, use }),
      [register, unregister, use],
   );

   return (
      <SidebarManagerContext.Provider value={value}>
         {children}
      </SidebarManagerContext.Provider>
   );
}

function SidebarManager({
   children,
   name,
}: { children: React.ReactNode; name: string }) {
   const sidebarContext = useSidebar();
   const manager = useSidebarManager();

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

   return <>{children}</>;
}

function SidebarManagerTrigger({
   name,
   className,
   onClick,
   ...props
}: React.ComponentProps<typeof Button> & { name: string }) {
   const manager = useSidebarManager();
   const sidebar = manager.use(name);

   return (
      <Button
         aria-label={`Toggle ${name} sidebar`}
         className={cn("size-7", className)}
         data-sidebar="manager-trigger"
         data-sidebar-name={name}
         data-slot="sidebar-manager-trigger"
         disabled={!sidebar}
         onClick={(event) => {
            onClick?.(event);
            sidebar?.toggleSidebar();
         }}
         size="icon"
         variant="ghost"
         {...props}
      >
         <MenuIcon />
         <span className="sr-only">Toggle {name} Sidebar</span>
      </Button>
   );
}
```

**Step 2: Add to exports at bottom of file**

```tsx
export {
   // ... existing exports ...
   SidebarManager,
   SidebarManagerProvider,
   SidebarManagerTrigger,
   useSidebarManager,
};
```

**Step 3: Commit**

```bash
git add packages/ui/src/components/sidebar.tsx
git commit -m "feat(ui): add SidebarManager registry pattern for multi-sidebar control"
```

---

## Task 2: Fix main sidebar icon alignment and collapse

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/app-sidebar.tsx`
- Modify: `apps/web/src/layout/dashboard/ui/sidebar-scope-switcher.tsx`
- Modify: `apps/web/src/layout/dashboard/ui/sidebar-nav.tsx`

### Step 1: Rewrite AppSidebar

Replace `app-sidebar.tsx` entirely:

- Replace `<Separator />` with `<SidebarSeparator />` (proper sidebar-aware separator)
- Replace manual `toggleSidebar` button with `<SidebarTrigger />` (official shadcn toggle with tooltip, chevron icon, proper icon-mode behavior)
- Add `<SidebarRail />` for drag-to-resize/click-to-toggle affordance
- Move Settings link above NavUser for better hierarchy

```tsx
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarRail,
   SidebarSeparator,
   SidebarTrigger,
} from "@packages/ui/components/sidebar";
import { Link, useParams } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import type * as React from "react";
import { NavUser } from "./nav-user";
import { SidebarNav } from "./sidebar-nav";
import { SidebarScopeSwitcher } from "./sidebar-scope-switcher";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   return (
      <Sidebar collapsible="icon" {...props}>
         <SidebarHeader>
            <SidebarScopeSwitcher />
         </SidebarHeader>

         <SidebarSeparator />

         <SidebarContent>
            <SidebarNav />
         </SidebarContent>

         <SidebarFooter>
            <SidebarFooterContent />
         </SidebarFooter>

         <SidebarRail />
      </Sidebar>
   );
}

function SidebarFooterContent() {
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? "";

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configuracoes">
               <Link params={{ slug }} to="/$slug/settings">
                  <Settings />
                  <span>Configuracoes</span>
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <NavUser />
         <SidebarMenuItem>
            <SidebarTrigger className="w-full" />
         </SidebarMenuItem>
      </SidebarMenu>
   );
}
```

### Step 2: Fix SidebarScopeSwitcher — use SidebarMenuButton size="lg"

The header uses a custom flex layout (manual avatar button + project trigger) that breaks in icon mode. Refactor to use the shadcn sidebar-07 pattern:

- Single `SidebarMenuButton size="lg"` wraps avatar + text
- In collapsed icon mode, the `lg` variant applies `size-8 p-0!`, so only avatar shows
- Text inside grid div is hidden by `overflow-hidden` on the button
- Remove the separate project switcher popover from header — merge into the org popover
- Use `<ChevronDown>` as visual indicator

The org avatar + org name + team name all go inside one `SidebarMenuButton size="lg"`. The popover opens on click and shows both org switching and project switching sections.

### Step 3: Fix SidebarNav — use CSS for ChevronRight hiding and use SidebarManager for sub-panel toggle

In `sidebar-nav.tsx`:

1. The `ChevronRight` for subPanel items uses a JS check `isExpanded`. Replace with CSS:
```tsx
<ChevronRight className="ml-auto size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
```
Remove the `isExpanded` variable and conditional rendering. CSS data attributes handle this automatically.

2. Change `onSubPanelToggle` to use `useSidebarManager()` instead of the custom TanStack Store toggle:
```tsx
// In SidebarNav component:
const manager = useSidebarManager();
const subPanel = manager.use("sub-panel");

const handleSubPanelToggle = useCallback(
   (section: SubSidebarSection) => {
      setActiveSection(section); // TanStack Store — tracks which section
      subPanel?.toggleSidebar(); // SidebarManager — controls open/close
   },
   [subPanel],
);
```

### Step 4: Commit

```bash
git add apps/web/src/layout/dashboard/ui/app-sidebar.tsx apps/web/src/layout/dashboard/ui/sidebar-scope-switcher.tsx apps/web/src/layout/dashboard/ui/sidebar-nav.tsx
git commit -m "fix(sidebar): fix icon alignment and collapse in main sidebar"
```

---

## Task 3: Refactor use-sidebar-nav hook — separate section tracking from open/close

**Files:**
- Modify: `apps/web/src/layout/dashboard/hooks/use-sidebar-nav.ts`

### Step 1: Simplify the store

The store no longer manages open/close state (that's the sub-panel `SidebarProvider`'s job via `SidebarManager`). It only tracks:
- `activeSection`: which section is active ("dashboards" | "insights" | null)
- `pinnedItems`: pinned sidebar items (unchanged)

Remove: `manualClose`, `openSubPanel`, `closeSubPanel`, `toggleSubPanel`, `setManualClose`, and the backward-compat aliases.

```tsx
import { Store, useStore } from "@tanstack/react-store";

export type SubSidebarSection = "dashboards" | "insights";

const PINNED_STORAGE_KEY = "contentta:sidebar-pinned";

function loadPinnedItems(): string[] {
   if (typeof window === "undefined") return [];
   try {
      const stored = localStorage.getItem(PINNED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
   } catch {
      return [];
   }
}

function savePinnedItems(items: string[]) {
   try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(items));
   } catch {
      // silently fail
   }
}

interface SidebarNavState {
   activeSection: SubSidebarSection | null;
   pinnedItems: string[];
}

const initialState: SidebarNavState = {
   activeSection: null,
   pinnedItems: loadPinnedItems(),
};

const sidebarNavStore = new Store<SidebarNavState>(initialState);

export function setActiveSection(section: SubSidebarSection | null) {
   sidebarNavStore.setState((state) => ({
      ...state,
      activeSection: section,
   }));
}

export function togglePinnedItem(itemId: string) {
   sidebarNavStore.setState((state) => {
      const pinned = state.pinnedItems.includes(itemId)
         ? state.pinnedItems.filter((id) => id !== itemId)
         : [...state.pinnedItems, itemId];
      savePinnedItems(pinned);
      return { ...state, pinnedItems: pinned };
   });
}

export function useSidebarNav() {
   const state = useStore(sidebarNavStore);

   return {
      activeSection: state.activeSection,
      pinnedItems: state.pinnedItems,
   };
}
```

### Step 2: Commit

```bash
git add apps/web/src/layout/dashboard/hooks/use-sidebar-nav.ts
git commit -m "refactor(sidebar): simplify hook to section tracking only, delegate open/close to SidebarManager"
```

---

## Task 4: Wire up DashboardLayout with SidebarManagerProvider + sub-panel sidebar

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/dashboard-layout.tsx`

### Step 1: Restructure layout

The `DashboardLayout` now hosts three sidebars:
1. **Main sidebar** — `SidebarProvider` + `SidebarManager name="main"` + `<AppSidebar />`
2. **Sub-panel sidebar** — nested `SidebarProvider` + `SidebarManager name="sub-panel"` + `<Sidebar variant="floating">` inside `SidebarInset`
3. **Settings sidebar** — rendered by `SettingsLayout` children (Task 5), also uses `SidebarManager name="settings"`

```tsx
import {
   SidebarInset,
   SidebarManager,
   SidebarManagerProvider,
   SidebarProvider,
} from "@packages/ui/components/sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import type * as React from "react";
import { useEffect, useRef } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useActiveTeam } from "@/hooks/use-active-team";
import { useLastOrganization } from "@/hooks/use-last-organization";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import { setActiveSection } from "../hooks/use-sidebar-nav";
import {
   getSidebarDefaultOpen,
   persistSidebarState,
} from "../hooks/use-sidebar-persistence";
import { AppSidebar } from "./app-sidebar";
import { SidebarSubPanel } from "./sidebar-sub-panel";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
   const { activeOrganization } = useActiveOrganization();
   const { activeTeam, teams } = useActiveTeam();
   const { setLastSlug } = useLastOrganization();
   const queryClient = useQueryClient();
   const setTeamForOrgRef = useRef(new Set<string>());
   const { pathname } = useLocation();

   useEffect(() => {
      if (activeOrganization?.slug) {
         setLastSlug(activeOrganization.slug);
      }
   }, [activeOrganization?.slug, setLastSlug]);

   useEffect(() => {
      const orgId = activeOrganization?.id;
      if (!orgId) return;
      if (activeTeam || teams.length === 0) return;
      if (setTeamForOrgRef.current.has(orgId)) return;

      setTeamForOrgRef.current.add(orgId);

      const setDefaultTeam = async () => {
         await authClient.organization.setActiveTeam({
            teamId: teams[0]?.id,
         });

         await queryClient.invalidateQueries({
            queryKey: orpc.session.getSession.queryKey({}),
         });
      };

      void setDefaultTeam();
   }, [activeOrganization?.id, activeTeam, queryClient, teams]);

   // Set active section based on route (section tracking only — open/close is via SidebarManager)
   useEffect(() => {
      if (pathname.includes("/analytics/dashboards")) {
         setActiveSection("dashboards");
      } else if (pathname.includes("/analytics/insights")) {
         setActiveSection("insights");
      } else {
         setActiveSection(null);
      }
   }, [pathname]);

   return (
      <SidebarManagerProvider>
         <SidebarProvider
            defaultOpen={getSidebarDefaultOpen()}
            onOpenChange={persistSidebarState}
         >
            <SidebarManager name="main">
               <AppSidebar />
            </SidebarManager>

            <SidebarInset>
               <SidebarSubPanel />
               <main className="flex-1 overflow-y-auto p-4">{children}</main>
            </SidebarInset>
         </SidebarProvider>
      </SidebarManagerProvider>
   );
}
```

Key changes:
- `SidebarManagerProvider` is the outermost wrapper
- `SidebarManager name="main"` wraps `AppSidebar`
- Removed `TooltipProvider` (SidebarProvider already provides one)
- Removed `manualClose` logic — open/close is now via the sub-panel's own SidebarProvider
- `SidebarSubPanel` moved inside `SidebarInset` (it will render its own nested `SidebarProvider`)
- Route-based effect now only calls `setActiveSection()` (no open/close)

### Step 2: Commit

```bash
git add apps/web/src/layout/dashboard/ui/dashboard-layout.tsx
git commit -m "feat(sidebar): add SidebarManagerProvider, register main sidebar, restructure layout"
```

---

## Task 5: Convert floating sub-panel to a proper Sidebar with SidebarManager

**Files:**
- Rewrite: `apps/web/src/layout/dashboard/ui/sidebar-sub-panel.tsx`

### Step 1: Rewrite as a Sidebar variant="floating"

Convert the custom div-based floating panel to a proper `<Sidebar variant="floating">` inside its own `SidebarProvider`, registered as `SidebarManager name="sub-panel"`.

The sub-panel's `SidebarProvider` starts closed by default. Nav items toggle it open via `useSidebarManager().use("sub-panel")?.toggleSidebar()`. The active section (dashboards vs insights) comes from the TanStack Store.

```tsx
import { Input } from "@packages/ui/components/input";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
   SidebarManager,
   SidebarProvider,
   useSidebar,
   useSidebarManager,
} from "@packages/ui/components/sidebar";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSidebarNav } from "../hooks/use-sidebar-nav";
import { SubSidebarItemList } from "./sub-sidebar-item-list";
import { SubSidebarNewMenu } from "./sub-sidebar-new-menu";

const SECTION_TITLES: Record<string, string> = {
   dashboards: "Dashboards",
   insights: "Insights",
};

export function SidebarSubPanel() {
   const { activeSection } = useSidebarNav();

   return (
      <SidebarProvider
         defaultOpen={false}
         style={
            {
               "--sidebar-width": "280px",
            } as React.CSSProperties
         }
      >
         <SidebarManager name="sub-panel">
            <SubPanelSidebar activeSection={activeSection} />
         </SidebarManager>
      </SidebarProvider>
   );
}

function SubPanelSidebar({
   activeSection,
}: { activeSection: "dashboards" | "insights" | null }) {
   const { open, setOpen } = useSidebar();
   const [searchQuery, setSearchQuery] = useState("");

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

   return (
      <Sidebar
         className="border-r"
         collapsible="none"
         side="left"
      >
         {/* Header */}
         <SidebarHeader className="px-3 pt-3 pb-2">
            <div className="flex items-center justify-between gap-2">
               <h2 className="text-sm font-semibold">
                  {SECTION_TITLES[activeSection]}
               </h2>
               <div className="flex items-center gap-0.5">
                  <SubSidebarNewMenu section={activeSection} />
                  <button
                     aria-label="Fechar painel"
                     className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                     onClick={() => setOpen(false)}
                     type="button"
                  >
                     <X className="size-4" />
                  </button>
               </div>
            </div>

            {/* Search */}
            <div className="relative">
               <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
               <Input
                  className="h-8 pl-8 text-sm"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  value={searchQuery}
               />
            </div>
         </SidebarHeader>

         {/* Item List */}
         <SidebarContent>
            <SubSidebarItemList
               searchQuery={searchQuery}
               section={activeSection}
            />
         </SidebarContent>
      </Sidebar>
   );
}
```

Key architectural changes:
- No more custom `position: fixed` div — uses `<Sidebar collapsible="none">` inside a nested `SidebarProvider`
- No more backdrop/overlay — the sub-panel is an inline sidebar that takes space from `SidebarInset`
- Open/close managed by `SidebarProvider`'s own state, toggled via `SidebarManager name="sub-panel"`
- Section tracking (dashboards vs insights) still via TanStack Store
- Close button calls `setOpen(false)` directly on the local sidebar context
- Escape key handling comes free from the SidebarProvider (keyboard shortcut Ctrl+B)

### Step 2: Commit

```bash
git add apps/web/src/layout/dashboard/ui/sidebar-sub-panel.tsx
git commit -m "refactor(sidebar): convert floating sub-panel to proper Sidebar with SidebarManager"
```

---

## Task 6: Restructure Settings layout with nested SidebarProvider + SidebarManager

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/settings-layout.tsx`

### Step 1: Rewrite SettingsLayout

The settings sidebar renders as a second sidebar inside the `SidebarInset` area using the "Multiple Side-by-Side Sidebars" pattern:

- Own `SidebarProvider` (creates independent context)
- `SidebarManager name="settings"` for registry
- `Sidebar` with `collapsible="none"` and `className="sticky top-0 h-svh border-r"`
- `SidebarInset` wraps `ScrollArea` + main content
- Mobile behavior unchanged

```tsx
import { Button } from "@packages/ui/components/button";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
   SidebarInset,
   SidebarManager,
   SidebarProvider,
} from "@packages/ui/components/sidebar";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type * as React from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { SettingsMobileNav } from "./settings-mobile-nav";
import { SettingsSidebar } from "./settings-sidebar";

interface SettingsLayoutProps {
   children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
   const isMobile = useIsMobile();
   const { pathname } = useLocation();
   const { activeOrganization } = useActiveOrganization();

   const isIndexRoute = pathname.endsWith("/settings");

   if (isMobile) {
      if (isIndexRoute) {
         return <SettingsMobileNav />;
      }

      return (
         <div className="flex h-full flex-col gap-4">
            <Button asChild className="w-fit" size="sm" variant="ghost">
               <Link
                  params={{ slug: activeOrganization.slug }}
                  to="/$slug/settings"
               >
                  <ChevronLeft className="size-4 mr-1" />
                  Configuracoes
               </Link>
            </Button>
            <div className="flex-1">{children}</div>
         </div>
      );
   }

   return (
      <SidebarProvider
         className="min-h-0 w-full"
         style={
            {
               "--sidebar-width": "16rem",
            } as React.CSSProperties
         }
      >
         <SidebarManager name="settings">
            <Sidebar
               className="sticky top-0 h-svh border-r"
               collapsible="none"
            >
               <SidebarHeader className="px-3 pt-3 pb-0">
                  <div className="flex items-center gap-2">
                     <Button asChild className="w-fit" size="sm" variant="ghost">
                        <Link
                           params={{ slug: activeOrganization.slug }}
                           to="/$slug/home"
                        >
                           <ChevronLeft className="size-4 mr-1" />
                           Configuracoes
                        </Link>
                     </Button>
                  </div>
               </SidebarHeader>
               <SidebarContent>
                  <SettingsSidebar />
               </SidebarContent>
            </Sidebar>
         </SidebarManager>
         <SidebarInset>
            <ScrollArea className="h-svh">
               <main className="flex-1 min-w-0 p-6">{children}</main>
            </ScrollArea>
         </SidebarInset>
      </SidebarProvider>
   );
}
```

### Step 2: Commit

```bash
git add apps/web/src/layout/dashboard/ui/settings-layout.tsx
git commit -m "refactor(settings): use nested SidebarProvider with SidebarManager pattern"
```

---

## Task 7: Update SidebarNav to toggle sub-panel via SidebarManager

**Files:**
- Modify: `apps/web/src/layout/dashboard/ui/sidebar-nav.tsx`

### Step 1: Replace TanStack Store toggle with SidebarManager

The `SidebarNav` component currently imports `toggleSubPanel` from the store. Change it to use `useSidebarManager()`:

```tsx
import {
   useSidebarManager,
} from "@packages/ui/components/sidebar";
import { setActiveSection, useSidebarNav } from "../hooks/use-sidebar-nav";

export function SidebarNav() {
   const { pathname, searchStr } = useLocation();
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? pathname.split("/")[1] ?? "";
   const { activeSection } = useSidebarNav();
   const manager = useSidebarManager();

   const handleSubPanelToggle = useCallback(
      (section: SubSidebarSection) => {
         const subPanel = manager.use("sub-panel");
         if (activeSection === section && subPanel?.open) {
            // Same section clicked while open — close it
            subPanel.setOpen(false);
            setActiveSection(null);
         } else {
            // Different section or panel closed — open with new section
            setActiveSection(section);
            if (subPanel && !subPanel.open) {
               subPanel.setOpen(true);
            }
         }
      },
      [manager, activeSection],
   );

   const isItemActive = useCallback(
      (item: NavItemDef) => {
         const resolvedRoute = item.route.replace("$slug", slug);

         if (item.subPanel) {
            return (
               activeSection === item.subPanel ||
               pathname.startsWith(resolvedRoute)
            );
         }

         return pathname.startsWith(resolvedRoute) && !searchStr;
      },
      [slug, pathname, searchStr, activeSection],
   );

   return (
      <>
         {navGroups.map((group) => (
            <NavGroup
               group={group}
               isItemActive={isItemActive}
               key={group.id}
               onSubPanelToggle={handleSubPanelToggle}
               slug={slug}
            />
         ))}
      </>
   );
}
```

Key changes:
- `toggleSubPanel` (TanStack Store) replaced by `manager.use("sub-panel")?.setOpen()` / `toggleSidebar()`
- `activeSubPanel` renamed to `activeSection` (matches refactored store)
- Toggle logic: same section + open = close; different section or closed = set section + open

### Step 2: Update references in SidebarItemActions

In `sidebar-item-actions.tsx`, the `togglePinnedItem` import stays the same (it's still in the store). No changes needed here.

### Step 3: Commit

```bash
git add apps/web/src/layout/dashboard/ui/sidebar-nav.tsx
git commit -m "feat(sidebar): wire nav items to toggle sub-panel via SidebarManager"
```

---

## Task 8: Write tests

**Files:**
- Create: `apps/web/__tests__/layout/dashboard/app-sidebar.test.tsx`
- Create: `apps/web/__tests__/layout/dashboard/sidebar-sub-panel.test.tsx`
- Create: `apps/web/__tests__/layout/dashboard/settings-layout.test.tsx`

### Step 1: Write AppSidebar tests

Test:
- Renders without errors inside SidebarManagerProvider + SidebarProvider
- Contains SidebarTrigger
- Contains SidebarRail
- Contains Settings link
- Contains nav groups (Home, Conteudos, etc.)

### Step 2: Write SidebarSubPanel tests

Test:
- Renders nothing when sub-panel SidebarProvider is closed
- Renders Sidebar with correct title when opened and activeSection is set
- Shows search input
- Close button calls setOpen(false)
- Section title changes when activeSection changes

### Step 3: Write SettingsLayout tests

Test:
- Renders settings Sidebar on desktop (non-mobile)
- Registers as SidebarManager name="settings"
- Renders mobile nav on mobile when on index route
- Renders back button on mobile for non-index routes
- Contains search input in settings sidebar
- Renders nav sections (Projeto, Organizacao, Conta)

### Step 4: Run tests

```bash
bun run test apps/web/__tests__/layout/dashboard/
```

### Step 5: Commit

```bash
git add apps/web/__tests__/layout/dashboard/
git commit -m "test(sidebar): add tests for AppSidebar, SidebarSubPanel, and SettingsLayout"
```

---

## Task 9: Typecheck, lint, verify

### Step 1: Run typecheck

```bash
bun run typecheck
```

### Step 2: Run lint

```bash
bun run check
```

### Step 3: Fix any issues

### Step 4: Final commit if needed

```bash
git add -A
git commit -m "fix: address typecheck and lint issues from sidebar refactor"
```
