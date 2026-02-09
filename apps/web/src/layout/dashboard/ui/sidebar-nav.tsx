// apps/web/src/layout/dashboard/sidebar-nav.tsx
import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebarManager,
} from "@packages/ui/components/sidebar";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import { useActiveTeam } from "@/hooks/use-active-team";
import { ChevronRight } from "lucide-react";
import { useCallback } from "react";
import type { SubSidebarSection } from "@/hooks/use-sidebar-nav";
import { useSidebarNav } from "@/hooks/use-sidebar-nav";
import { SidebarItemActions } from "@/layout/dashboard/sidebar-item-actions";
import type { NavGroupDef, NavItemDef } from "@/layout/dashboard/sidebar-nav-items";
import { navGroups } from "@/layout/dashboard/sidebar-nav-items";

function NavItem({
   item,
   slug,
   teamId,
   isActive,
   onSubPanelToggle,
}: {
   item: NavItemDef;
   slug: string;
   teamId?: string | null;
   isActive: boolean;
   onSubPanelToggle: (section: SubSidebarSection) => void;
}) {
   const Icon = item.icon;

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
                  <ChevronRight className="ml-auto size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
               </button>
            ) : (
               <Link
                  to={
                     teamId
                        ? item.route.replace("/$slug", `/${slug}/${teamId}`)
                        : item.route
                  }
               >
                  <Icon />
                  <span>{item.label}</span>
               </Link>
            )}
         </SidebarMenuButton>

         {/* Action buttons — hidden when sidebar is collapsed */}
         <div className="group-data-[collapsible=icon]:hidden">
            <SidebarItemActions item={item} slug={slug} />
         </div>
      </SidebarMenuItem>
   );
}

function NavGroup({
   group,
   slug,
   teamId,
   isItemActive,
   onSubPanelToggle,
}: {
   group: NavGroupDef;
   slug: string;
   teamId?: string | null;
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
                     teamId={teamId}
                  />
               ))}
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}

export function SidebarNav() {
   const { pathname, searchStr } = useLocation();
   const params = useParams({ strict: false }) as {
      slug?: string;
      teamId?: string;
   };
   const slug = params.slug ?? pathname.split("/")[1] ?? "";
   const { activeTeamId } = useActiveTeam();
   const teamId = params.teamId ?? activeTeamId ?? null;
   const { activeSubPanel } = useSidebarNav();
   const manager = useSidebarManager();

   const handleSubPanelToggle = useCallback(
      (section: SubSidebarSection) => {
         const subPanel = manager.use("sub-panel");
         if (activeSubPanel === section && subPanel?.open) {
            // Same section clicked while open — close it
            subPanel.setOpen(false);
         } else {
            // Different section or panel closed — open with new section
            if (subPanel && !subPanel.open) {
               subPanel.setOpen(true);
            }
         }
      },
      [manager, activeSubPanel],
   );

   const isItemActive = useCallback(
      (item: NavItemDef) => {
         const resolvedRoute = teamId
            ? item.route.replace("/$slug", `/${slug}/${teamId}`)
            : item.route.replace("$slug", slug);

         if (item.subPanel) {
            return (
               activeSubPanel === item.subPanel ||
               pathname.startsWith(resolvedRoute)
            );
         }

         return pathname.startsWith(resolvedRoute) && !searchStr;
      },
      [slug, teamId, pathname, searchStr, activeSubPanel],
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
               teamId={teamId}
            />
         ))}
      </>
   );
}
