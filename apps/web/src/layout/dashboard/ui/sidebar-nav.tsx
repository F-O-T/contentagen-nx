// apps/web/src/layout/dashboard/sidebar-nav.tsx

import { FeatureStageBadge } from "@packages/ui/components/feature-stage-badge";
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
import { useActiveTeam } from "@/hooks/use-active-team";
import { useEarlyAccess } from "@/hooks/use-early-access";
import type { SubSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";
import {
   setActiveSection,
   useSidebarNav,
} from "@/layout/dashboard/hooks/use-sidebar-nav";
import { SidebarItemActions } from "@/layout/dashboard/ui/sidebar-item-actions";
import type {
   NavGroupDef,
   NavItemDef,
} from "@/layout/dashboard/ui/sidebar-nav-items";
import { navGroups } from "@/layout/dashboard/ui/sidebar-nav-items";

function NavItem({
   item,
   slug,
   teamSlug,
   isActive,
   onSubPanelToggle,
   onMainItemClick,
}: {
   item: NavItemDef;
   slug: string;
   teamSlug?: string | null;
   isActive: boolean;
   onSubPanelToggle: (section: SubSidebarSection) => void;
   onMainItemClick: () => void;
}) {
   const Icon = item.icon;
   const { features } = useEarlyAccess();
   const feature = item.earlyAccessFlag
      ? features.find((f) => f.flagKey === item.earlyAccessFlag)
      : undefined;
   const stage = feature?.stage ?? item.earlyAccessStage ?? "beta";

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
               <>
                  <Icon />
                  <span>{item.label}</span>
                  {item.earlyAccessFlag && (
                     <FeatureStageBadge
                        className="ml-1.5 group-data-[collapsible=icon]:hidden"
                        stage={stage}
                     />
                  )}
                  <ChevronRight className="ml-auto size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
               </>
            ) : (
               <Link
                  onClick={onMainItemClick}
                  to={item.route
                     .replace("$slug", slug)
                     .replace("$teamSlug", teamSlug ?? "")}
               >
                  <Icon />
                  <span>{item.label}</span>
                  {item.earlyAccessFlag && (
                     <FeatureStageBadge
                        className="ml-1.5 group-data-[collapsible=icon]:hidden"
                        stage={stage}
                     />
                  )}
               </Link>
            )}
         </SidebarMenuButton>

         {/* Action buttons — hidden when sidebar is collapsed */}
         <div className="group-data-[collapsible=icon]:hidden">
            <SidebarItemActions item={item} slug={slug} teamSlug={teamSlug} />
         </div>
      </SidebarMenuItem>
   );
}

function NavGroup({
   group,
   slug,
   teamSlug,
   isItemActive,
   onSubPanelToggle,
   onMainItemClick,
}: {
   group: NavGroupDef;
   slug: string;
   teamSlug?: string | null;
   isItemActive: (item: NavItemDef) => boolean;
   onSubPanelToggle: (section: SubSidebarSection) => void;
   onMainItemClick: () => void;
}) {
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
                     teamSlug={teamSlug}
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
      teamSlug?: string;
   };
   const slug = params.slug ?? pathname.split("/")[1] ?? "";
   const { activeTeamId } = useActiveTeam();
   const teamSlug = params.teamSlug ?? activeTeamId ?? null;
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

   const handleMainItemClick = useCallback(() => {
      const subPanel = manager.use("sub-panel");
      if (subPanel?.open) {
         subPanel.setOpen(false);
      }
      if (activeSection) {
         setActiveSection(null);
      }
   }, [manager, activeSection]);

   const isItemActive = useCallback(
      (item: NavItemDef) => {
         const resolvedRoute = item.route
            .replace("$slug", slug)
            .replace("$teamSlug", teamSlug ?? "");

         if (item.subPanel) {
            return (
               activeSection === item.subPanel ||
               pathname.startsWith(resolvedRoute)
            );
         }

         return pathname.startsWith(resolvedRoute) && !searchStr;
      },
      [slug, teamSlug, pathname, searchStr, activeSection],
   );

   return (
      <>
         {navGroups.map((group) => (
            <NavGroup
               group={group}
               isItemActive={isItemActive}
               key={group.id}
               onMainItemClick={handleMainItemClick}
               onSubPanelToggle={handleSubPanelToggle}
               slug={slug}
               teamSlug={teamSlug}
            />
         ))}
      </>
   );
}
