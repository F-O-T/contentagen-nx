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
