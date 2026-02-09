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
import { ChevronRight } from "lucide-react";
import { useCallback } from "react";
import type { SubSidebarSection } from "../hooks/use-sidebar-nav";
import { setActiveSection, useSidebarNav } from "../hooks/use-sidebar-nav";
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
               <Link params={{ slug }} to={item.route}>
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
