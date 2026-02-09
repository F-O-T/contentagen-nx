# PostHog-Style Collapsible Sidebar Refactor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current IconRail + SubSidebar two-piece layout with a single PostHog-style collapsible sidebar featuring quick-action buttons, hover context menus, and floating sub-panels with backdrop blur.

**Architecture:** Single `<Sidebar>` component using shadcn's sidebar primitives (`SidebarProvider`, `Sidebar` with `collapsible="icon"`). Nav items use `SidebarMenuAction` for `+` quick-create and `...` hover menus. Sub-panels for Dashboards/Insights render as absolutely-positioned floating panels with backdrop blur, managed via TanStack Store. Collapsed/expanded state persists in `localStorage`.

**Tech Stack:** React 19, shadcn/ui sidebar primitives, TanStack Store, TanStack Router, lucide-react, Tailwind CSS 4

---

## File Map

### Files to Create
- `apps/web/src/layout/dashboard/sidebar-nav-items.ts` — nav item definitions with action config
- `apps/web/src/layout/dashboard/sidebar-nav.tsx` — main nav renderer with groups
- `apps/web/src/layout/dashboard/sidebar-item-actions.tsx` — `+` button and `...` hover menu per item
- `apps/web/src/layout/dashboard/sidebar-sub-panel.tsx` — floating sub-panel with backdrop blur
- `apps/web/src/hooks/use-sidebar-persistence.ts` — localStorage persistence for collapsed state

### Files to Modify
- `apps/web/src/layout/dashboard/dashboard-layout.tsx` — replace IconRail+SubSidebar with new Sidebar
- `apps/web/src/layout/dashboard/app-sidebar.tsx` — rewrite as the new single sidebar shell
- `apps/web/src/hooks/use-sidebar-nav.ts` — add pinned items + sub-panel state

### Files to Delete (after migration)
- `apps/web/src/layout/dashboard/icon-rail.tsx`
- `apps/web/src/layout/dashboard/icon-rail-items.ts`
- `apps/web/src/layout/dashboard/sub-sidebar.tsx`
- `apps/web/src/layout/dashboard/nav-main.tsx`

### Files to Keep (reused as-is)
- `apps/web/src/layout/dashboard/sub-sidebar-item-list.tsx` — reused inside new sub-panel
- `apps/web/src/layout/dashboard/sub-sidebar-new-menu.tsx` — reused for `+` actions on Dashboards/Insights
- `apps/web/src/layout/dashboard/sub-sidebar-context-menu.tsx` — reused for item context menus
- `apps/web/src/layout/dashboard/compact-scope-switcher.tsx` — reused in collapsed state header
- `apps/web/src/layout/dashboard/sidebar-scope-switcher.tsx` — reused in expanded state header
- `apps/web/src/layout/dashboard/nav-user.tsx` — reused in sidebar footer
- `apps/web/src/layout/dashboard/settings-sidebar.tsx` — unchanged, only used on settings pages
- `apps/web/src/layout/dashboard/theme-switcher.tsx` — reused in user menu
- `apps/web/src/layout/dashboard/language-command.tsx` — reused in user menu

---

## Task 1: Create Sidebar Persistence Hook

**Files:**
- Create: `apps/web/src/hooks/use-sidebar-persistence.ts`

**Step 1: Create the hook**

This hook reads/writes the sidebar collapsed state to `localStorage` so it persists across sessions.

```typescript
// apps/web/src/hooks/use-sidebar-persistence.ts
const STORAGE_KEY = "contentta:sidebar-collapsed";

export function getSidebarDefaultOpen(): boolean {
   if (typeof window === "undefined") return true;
   try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) return true;
      return stored !== "true";
   } catch {
      return true;
   }
}

export function persistSidebarState(open: boolean) {
   try {
      localStorage.setItem(STORAGE_KEY, String(!open));
   } catch {
      // Silently fail if localStorage is unavailable
   }
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/use-sidebar-persistence.ts
git commit -m "feat(sidebar): add localStorage persistence hook for collapsed state"
```

---

## Task 2: Update Sidebar Nav Store

**Files:**
- Modify: `apps/web/src/hooks/use-sidebar-nav.ts`

**Step 1: Add pinned items and sub-panel positioning to the store**

Replace the entire file with:

```typescript
// apps/web/src/hooks/use-sidebar-nav.ts
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
   activeSubPanel: SubSidebarSection | null;
   manualClose: boolean;
   pinnedItems: string[];
}

const initialState: SidebarNavState = {
   activeSubPanel: null,
   manualClose: false,
   pinnedItems: loadPinnedItems(),
};

const sidebarNavStore = new Store<SidebarNavState>(initialState);

export function openSubPanel(section: SubSidebarSection) {
   sidebarNavStore.setState((state) => ({
      ...state,
      activeSubPanel: section,
      manualClose: false,
   }));
}

export function closeSubPanel() {
   sidebarNavStore.setState((state) => ({
      ...state,
      activeSubPanel: null,
   }));
}

export function toggleSubPanel(section: SubSidebarSection) {
   sidebarNavStore.setState((state) => {
      if (state.activeSubPanel === section) {
         return { ...state, activeSubPanel: null, manualClose: true };
      }
      return { ...state, activeSubPanel: section, manualClose: false };
   });
}

export function setManualClose() {
   sidebarNavStore.setState((state) => ({
      ...state,
      manualClose: true,
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
      activeSubPanel: state.activeSubPanel,
      manualClose: state.manualClose,
      pinnedItems: state.pinnedItems,
      openSubPanel,
      closeSubPanel,
      toggleSubPanel,
      setManualClose,
      togglePinnedItem,
   };
}

// Keep old names as aliases for backward compat during migration
export const openSubSidebar = openSubPanel;
export const closeSubSidebar = closeSubPanel;
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/use-sidebar-nav.ts
git commit -m "feat(sidebar): update nav store with pinned items and sub-panel state"
```

---

## Task 3: Create Nav Item Definitions

**Files:**
- Create: `apps/web/src/layout/dashboard/sidebar-nav-items.ts`

**Step 1: Define nav items with action configuration**

```typescript
// apps/web/src/layout/dashboard/sidebar-nav-items.ts
import type { LucideIcon } from "lucide-react";
import {
   BarChart3,
   ClipboardList,
   Database,
   FileText,
   House,
   LayoutDashboard,
   Lightbulb,
} from "lucide-react";
import type { SubSidebarSection } from "@/hooks/use-sidebar-nav";

export type NavItemAction = {
   type: "create";
   /** Route to navigate to for creation, or "sheet" to open a create sheet */
   target: "navigate" | "sheet" | "sub-menu";
};

export type NavItemDef = {
   id: string;
   label: string;
   icon: LucideIcon;
   route: string;
   /** Show a '+' quick-action button */
   quickAction?: NavItemAction;
   /** Item expands a floating sub-panel */
   subPanel?: SubSidebarSection;
};

export type NavGroupDef = {
   id: string;
   label: string;
   icon?: LucideIcon;
   items: NavItemDef[];
};

export const navGroups: NavGroupDef[] = [
   {
      id: "main",
      label: "Principal",
      items: [
         {
            id: "home",
            label: "Início",
            icon: House,
            route: "/$slug/home",
         },
         {
            id: "content",
            label: "Conteúdos",
            icon: FileText,
            route: "/$slug/content",
            quickAction: { type: "create", target: "navigate" },
         },
         {
            id: "forms",
            label: "Formulários",
            icon: ClipboardList,
            route: "/$slug/forms",
            quickAction: { type: "create", target: "navigate" },
         },
      ],
   },
   {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      items: [
         {
            id: "dashboards",
            label: "Dashboards",
            icon: LayoutDashboard,
            route: "/$slug/analytics/dashboards",
            quickAction: { type: "create", target: "sub-menu" },
            subPanel: "dashboards",
         },
         {
            id: "insights",
            label: "Insights",
            icon: Lightbulb,
            route: "/$slug/analytics/insights",
            quickAction: { type: "create", target: "sub-menu" },
            subPanel: "insights",
         },
         {
            id: "data-management",
            label: "Dados",
            icon: Database,
            route: "/$slug/analytics/data-management",
         },
      ],
   },
];
```

**Step 2: Commit**

```bash
git add apps/web/src/layout/dashboard/sidebar-nav-items.ts
git commit -m "feat(sidebar): add nav item definitions with action config"
```

---

## Task 4: Create Sidebar Item Actions Component

**Files:**
- Create: `apps/web/src/layout/dashboard/sidebar-item-actions.tsx`

**Step 1: Build the `+` quick-action and `...` hover menu**

This component renders the action buttons that appear on each sidebar nav item. The `+` button is always visible (when expanded), and the `...` menu appears on hover.

```typescript
// apps/web/src/layout/dashboard/sidebar-item-actions.tsx
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { SidebarMenuAction } from "@packages/ui/components/sidebar";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ExternalLink, MoreHorizontal, Pin, Plus } from "lucide-react";
import { togglePinnedItem, useSidebarNav } from "@/hooks/use-sidebar-nav";
import type { NavItemDef } from "./sidebar-nav-items";
import { SubSidebarNewMenu } from "./sub-sidebar-new-menu";

function QuickCreateButton({
   item,
   slug,
}: {
   item: NavItemDef;
   slug: string;
}) {
   const navigate = useNavigate();

   if (!item.quickAction) return null;

   // For sub-menu items (dashboards/insights), delegate to SubSidebarNewMenu
   if (item.quickAction.target === "sub-menu" && item.subPanel) {
      return <SubSidebarNewMenu section={item.subPanel} />;
   }

   // For navigate items, go to the create route
   const handleCreate = () => {
      const resolvedRoute = item.route.replace("$slug", slug);
      void navigate({ to: `${resolvedRoute}/new` });
   };

   return (
      <SidebarMenuAction onClick={handleCreate} title="Criar novo">
         <Plus className="size-4" />
      </SidebarMenuAction>
   );
}

function MoreMenu({ item }: { item: NavItemDef }) {
   const { pinnedItems } = useSidebarNav();
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? "";
   const isPinned = pinnedItems.includes(item.id);
   const resolvedRoute = item.route.replace("$slug", slug);

   const handleOpenNewTab = () => {
      window.open(resolvedRoute, "_blank");
   };

   const handleTogglePin = () => {
      togglePinnedItem(item.id);
   };

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <SidebarMenuAction
               className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity data-[state=open]:opacity-100"
               title="Mais opções"
            >
               <MoreHorizontal className="size-4" />
            </SidebarMenuAction>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="start" side="right" sideOffset={8}>
            <DropdownMenuItem onClick={handleOpenNewTab}>
               <ExternalLink className="size-4" />
               <span>Abrir em nova aba</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleTogglePin}>
               <Pin className="size-4" />
               <span>{isPinned ? "Desafixar" : "Fixar no topo"}</span>
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}

export function SidebarItemActions({
   item,
   slug,
}: {
   item: NavItemDef;
   slug: string;
}) {
   return (
      <>
         {item.quickAction && <QuickCreateButton item={item} slug={slug} />}
         <MoreMenu item={item} />
      </>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/layout/dashboard/sidebar-item-actions.tsx
git commit -m "feat(sidebar): add quick-action and hover context menu components"
```

---

## Task 5: Create Floating Sub-Panel Component

**Files:**
- Create: `apps/web/src/layout/dashboard/sidebar-sub-panel.tsx`

**Step 1: Build the floating sub-panel with backdrop blur**

This panel appears to the right of the sidebar (overlaying main content) when Dashboards/Insights chevron is clicked. It reuses the existing `SubSidebarItemList` for content.

```typescript
// apps/web/src/layout/dashboard/sidebar-sub-panel.tsx
import { Input } from "@packages/ui/components/input";
import { cn } from "@packages/ui/lib/utils";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
   closeSubPanel,
   setManualClose,
   useSidebarNav,
} from "@/hooks/use-sidebar-nav";
import { SubSidebarItemList } from "./sub-sidebar-item-list";
import { SubSidebarNewMenu } from "./sub-sidebar-new-menu";

const SECTION_TITLES: Record<string, string> = {
   dashboards: "Dashboards",
   insights: "Insights",
};

export function SidebarSubPanel() {
   const { activeSubPanel } = useSidebarNav();
   const [searchQuery, setSearchQuery] = useState("");
   const panelRef = useRef<HTMLDivElement>(null);
   const isOpen = activeSubPanel !== null;

   const handleClose = () => {
      closeSubPanel();
      setManualClose();
      setSearchQuery("");
   };

   // Close on click outside (on the backdrop)
   const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
         handleClose();
      }
   };

   // Close on Escape
   useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === "Escape") {
            handleClose();
         }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [isOpen]);

   // Reset search when section changes
   useEffect(() => {
      setSearchQuery("");
   }, [activeSubPanel]);

   if (!isOpen || !activeSubPanel) return null;

   return (
      <>
         {/* Backdrop with blur */}
         <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px] transition-opacity"
            onClick={handleBackdropClick}
         />

         {/* Floating panel — positioned next to the sidebar */}
         <div
            className={cn(
               "fixed z-50 top-2 bottom-2 left-[var(--sidebar-panel-left)] w-[280px]",
               "rounded-lg border bg-background shadow-xl",
               "flex flex-col overflow-hidden",
               "animate-in slide-in-from-left-2 fade-in-0 duration-200",
            )}
            ref={panelRef}
            style={{
               // Will be set via CSS variable from the sidebar width
               "--sidebar-panel-left": "calc(var(--sidebar-width, 220px) + 8px)",
            } as React.CSSProperties}
         >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
               <h2 className="text-sm font-semibold">
                  {SECTION_TITLES[activeSubPanel]}
               </h2>
               <div className="flex items-center gap-0.5">
                  <SubSidebarNewMenu section={activeSubPanel} />
                  <button
                     aria-label="Fechar painel"
                     className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                     onClick={handleClose}
                     type="button"
                  >
                     <X className="size-4" />
                  </button>
               </div>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
               <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                     className="h-8 pl-8 text-sm"
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Buscar..."
                     value={searchQuery}
                  />
               </div>
            </div>

            {/* Item List (reused from existing sub-sidebar) */}
            <div className="flex-1 overflow-y-auto">
               <SubSidebarItemList
                  searchQuery={searchQuery}
                  section={activeSubPanel}
               />
            </div>
         </div>
      </>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/layout/dashboard/sidebar-sub-panel.tsx
git commit -m "feat(sidebar): add floating sub-panel with backdrop blur"
```

---

## Task 6: Create Sidebar Nav Component

**Files:**
- Create: `apps/web/src/layout/dashboard/sidebar-nav.tsx`

**Step 1: Build the main nav renderer**

This renders all nav groups with their items, handling active state, sub-panel toggling, and action buttons.

```typescript
// apps/web/src/layout/dashboard/sidebar-nav.tsx
import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useCallback } from "react";
import type { SubSidebarSection } from "@/hooks/use-sidebar-nav";
import { toggleSubPanel, useSidebarNav } from "@/hooks/use-sidebar-nav";
import { SidebarItemActions } from "./sidebar-item-actions";
import type { NavGroupDef, NavItemDef } from "./sidebar-nav-items";
import { navGroups } from "./sidebar-nav-items";

function NavItem({
   item,
   slug,
   isActive,
   onSubPanelToggle,
}: {
   item: NavItemDef;
   slug: string;
   isActive: boolean;
   onSubPanelToggle: (section: SubSidebarSection) => void;
}) {
   const { state: sidebarState } = useSidebar();
   const Icon = item.icon;
   const resolvedRoute = item.route.replace("$slug", slug);
   const isExpanded = sidebarState === "expanded";

   const handleClick = useCallback(
      (e: React.MouseEvent) => {
         // If item has a sub-panel, toggle it instead of navigating
         if (item.subPanel) {
            e.preventDefault();
            onSubPanelToggle(item.subPanel);
         }
      },
      [item.subPanel, onSubPanelToggle],
   );

   return (
      <SidebarMenuItem className="group/menu-item">
         <SidebarMenuButton
            asChild={!item.subPanel}
            isActive={isActive}
            onClick={item.subPanel ? handleClick : undefined}
            tooltip={item.label}
         >
            {item.subPanel ? (
               <button type="button">
                  <Icon />
                  <span>{item.label}</span>
                  {isExpanded && (
                     <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                  )}
               </button>
            ) : (
               <Link params={{ slug }} to={item.route}>
                  <Icon />
                  <span>{item.label}</span>
               </Link>
            )}
         </SidebarMenuButton>

         {/* Action buttons — only show when sidebar is expanded */}
         {isExpanded && <SidebarItemActions item={item} slug={slug} />}
      </SidebarMenuItem>
   );
}

function NavGroup({
   group,
   slug,
   isItemActive,
   onSubPanelToggle,
}: {
   group: NavGroupDef;
   slug: string;
   isItemActive: (item: NavItemDef) => boolean;
   onSubPanelToggle: (section: SubSidebarSection) => void;
}) {
   return (
      <SidebarGroup>
         <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
         <SidebarGroupContent>
            <SidebarMenu>
               {group.items.map((item) => (
                  <NavItem
                     isActive={isItemActive(item)}
                     item={item}
                     key={item.id}
                     onSubPanelToggle={onSubPanelToggle}
                     slug={slug}
                  />
               ))}
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}

export function SidebarNav() {
   const { pathname, searchStr } = useLocation();
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? pathname.split("/")[1] ?? "";
   const { activeSubPanel } = useSidebarNav();

   const isItemActive = useCallback(
      (item: NavItemDef) => {
         const resolvedRoute = item.route.replace("$slug", slug);

         // For sub-panel items, also highlight if the panel is open
         if (item.subPanel) {
            return (
               activeSubPanel === item.subPanel ||
               pathname.startsWith(resolvedRoute)
            );
         }

         return pathname.startsWith(resolvedRoute) && !searchStr;
      },
      [slug, pathname, searchStr, activeSubPanel],
   );

   return (
      <>
         {navGroups.map((group) => (
            <NavGroup
               group={group}
               isItemActive={isItemActive}
               key={group.id}
               onSubPanelToggle={toggleSubPanel}
               slug={slug}
            />
         ))}
      </>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/layout/dashboard/sidebar-nav.tsx
git commit -m "feat(sidebar): add main nav renderer with groups and item actions"
```

---

## Task 7: Rewrite AppSidebar Shell

**Files:**
- Modify: `apps/web/src/layout/dashboard/app-sidebar.tsx`

**Step 1: Rewrite as the new single sidebar**

Replace the entire file. This is the main sidebar shell that composes the header (org switcher), nav, and footer (settings + user).

```typescript
// apps/web/src/layout/dashboard/app-sidebar.tsx
import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Link, useParams } from "@tanstack/react-router";
import { PanelLeft, Search, Settings } from "lucide-react";
import type * as React from "react";
import { NavUser } from "./nav-user";
import { SidebarNav } from "./sidebar-nav";
import { SidebarScopeSwitcher } from "./sidebar-scope-switcher";
import { CompactScopeSwitcher } from "./compact-scope-switcher";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   return (
      <Sidebar collapsible="icon" {...props}>
         <SidebarHeader>
            <SidebarScopeSwitcher />
         </SidebarHeader>

         <SidebarContent>
            <Separator />
            <SidebarNav />
         </SidebarContent>

         <SidebarFooter>
            <SidebarFooterContent />
         </SidebarFooter>
      </Sidebar>
   );
}

function SidebarFooterContent() {
   const { toggleSidebar } = useSidebar();
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? "";

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar} tooltip="Recolher menu">
               <PanelLeft />
               <span>Recolher menu</span>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configurações">
               <Link params={{ slug }} to="/$slug/settings">
                  <Settings />
                  <span>Configurações</span>
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <NavUser />
      </SidebarMenu>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/layout/dashboard/app-sidebar.tsx
git commit -m "feat(sidebar): rewrite app-sidebar as single collapsible sidebar shell"
```

---

## Task 8: Rewrite Dashboard Layout

**Files:**
- Modify: `apps/web/src/layout/dashboard/dashboard-layout.tsx`

**Step 1: Replace IconRail + SubSidebar with SidebarProvider + AppSidebar + SubPanel**

Replace the entire file:

```typescript
// apps/web/src/layout/dashboard/dashboard-layout.tsx
import { SidebarInset, SidebarProvider } from "@packages/ui/components/sidebar";
import { TooltipProvider } from "@packages/ui/components/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import type * as React from "react";
import { useEffect, useRef } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useActiveTeam } from "@/hooks/use-active-team";
import { useLastOrganization } from "@/hooks/use-last-organization";
import {
   closeSubPanel,
   openSubPanel,
   useSidebarNav,
} from "@/hooks/use-sidebar-nav";
import {
   getSidebarDefaultOpen,
   persistSidebarState,
} from "@/hooks/use-sidebar-persistence";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import { AppSidebar } from "./app-sidebar";
import { SidebarSubPanel } from "./sidebar-sub-panel";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
   const { activeOrganization } = useActiveOrganization();
   const { activeTeam, teams } = useActiveTeam();
   const { setLastSlug } = useLastOrganization();
   const queryClient = useQueryClient();
   const setTeamForOrgRef = useRef(new Set<string>());
   const { manualClose } = useSidebarNav();
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

   useEffect(() => {
      if (pathname.includes("/analytics/dashboards")) {
         if (!manualClose) {
            openSubPanel("dashboards");
         }
      } else if (pathname.includes("/analytics/insights")) {
         if (!manualClose) {
            openSubPanel("insights");
         }
      } else {
         closeSubPanel();
      }
   }, [pathname, manualClose]);

   return (
      <TooltipProvider delayDuration={200}>
         <SidebarProvider
            defaultOpen={getSidebarDefaultOpen()}
            onOpenChange={persistSidebarState}
         >
            <AppSidebar />
            <SidebarSubPanel />
            <SidebarInset>
               <main className="flex-1 overflow-y-auto p-4">{children}</main>
            </SidebarInset>
         </SidebarProvider>
      </TooltipProvider>
   );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/layout/dashboard/dashboard-layout.tsx
git commit -m "feat(sidebar): rewrite dashboard layout with SidebarProvider and floating sub-panel"
```

---

## Task 9: Update SubSidebarNewMenu to Work as SidebarMenuAction

**Files:**
- Modify: `apps/web/src/layout/dashboard/sub-sidebar-new-menu.tsx`

**Step 1: Make the trigger component configurable**

The existing `SubSidebarNewMenu` renders its own button. We need it to also work inside `SidebarMenuAction` context. The simplest approach: check if it's used as a `SidebarMenuAction` trigger by accepting an optional `asSidebarAction` prop.

Read the current file first, then modify only the trigger button to optionally render as a `SidebarMenuAction`. If the current implementation already uses a generic button trigger with a DropdownMenu, it may just need the `SidebarMenuAction` wrapper in `sidebar-item-actions.tsx` instead.

**Decision:** If the existing `SubSidebarNewMenu` already exports a dropdown with a generic trigger, just wrap it in `sidebar-item-actions.tsx`. No modification needed here. Skip this task if that's the case — the integration in Task 4 already handles it by rendering `<SubSidebarNewMenu section={item.subPanel} />` directly.

**Step 2: Commit (only if changes were needed)**

```bash
git add apps/web/src/layout/dashboard/sub-sidebar-new-menu.tsx
git commit -m "refactor(sidebar): make SubSidebarNewMenu trigger configurable"
```

---

## Task 10: Clean Up Old Files

**Files:**
- Delete: `apps/web/src/layout/dashboard/icon-rail.tsx`
- Delete: `apps/web/src/layout/dashboard/icon-rail-items.ts`
- Delete: `apps/web/src/layout/dashboard/sub-sidebar.tsx`
- Delete: `apps/web/src/layout/dashboard/nav-main.tsx`

**Step 1: Search for any remaining imports of deleted files**

Run: `grep -r "icon-rail\|sub-sidebar\|nav-main" apps/web/src/ --include="*.ts" --include="*.tsx" -l`

Fix any remaining imports to point to the new files.

**Step 2: Delete the old files**

```bash
rm apps/web/src/layout/dashboard/icon-rail.tsx
rm apps/web/src/layout/dashboard/icon-rail-items.ts
rm apps/web/src/layout/dashboard/sub-sidebar.tsx
rm apps/web/src/layout/dashboard/nav-main.tsx
```

**Step 3: Commit**

```bash
git add -u
git commit -m "refactor(sidebar): remove old icon-rail and sub-sidebar files"
```

---

## Task 11: Verify and Fix TypeScript + Visual

**Step 1: Run typecheck**

```bash
bun run typecheck
```

Fix any type errors.

**Step 2: Run dev server and visually verify**

```bash
bun dev
```

Verify:
- [ ] Sidebar renders expanded with icons + labels
- [ ] Clicking "Recolher menu" collapses to icon-only mode
- [ ] Collapsed state persists after page refresh
- [ ] `+` buttons appear on Content, Forms, Dashboards items
- [ ] `...` menu appears on hover for each nav item
- [ ] Clicking Dashboards/Insights opens floating sub-panel with backdrop blur
- [ ] Clicking backdrop or pressing Escape closes sub-panel
- [ ] Sub-panel contains search + item list
- [ ] "Open in new tab" works from `...` menu
- [ ] "Pin to top" toggles pin state
- [ ] Active nav item is highlighted
- [ ] Org switcher works in both expanded/collapsed states

**Step 3: Fix any visual/behavioral issues found**

**Step 4: Final commit**

```bash
git add .
git commit -m "fix(sidebar): address typecheck and visual polish"
```

---

## Summary

| Task | Description | New/Modify |
|------|-------------|------------|
| 1 | Sidebar persistence hook | Create |
| 2 | Update sidebar nav store (pinned items) | Modify |
| 3 | Nav item definitions | Create |
| 4 | Item action buttons (+, ...) | Create |
| 5 | Floating sub-panel with blur | Create |
| 6 | Main nav renderer | Create |
| 7 | Rewrite app-sidebar shell | Modify |
| 8 | Rewrite dashboard layout | Modify |
| 9 | Update SubSidebarNewMenu (if needed) | Modify |
| 10 | Delete old files + fix imports | Delete |
| 11 | Typecheck + visual verification | Verify |
