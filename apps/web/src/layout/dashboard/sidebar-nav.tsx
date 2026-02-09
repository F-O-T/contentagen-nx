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
