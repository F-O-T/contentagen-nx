import { identifyClient, setClientGroup } from "@packages/posthog/client";
import {
   SidebarInset,
   SidebarManager,
   SidebarManagerProvider,
   SidebarProvider,
} from "@packages/ui/components/sidebar";
import { cn } from "@packages/ui/lib/utils";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import type * as React from "react";
import { useEffect, useRef } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useActiveTeam } from "@/hooks/use-active-team";
import { EarlyAccessProvider } from "@/hooks/use-early-access";
import { useLastOrganization } from "@/hooks/use-last-organization";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import { setActiveSection } from "../hooks/use-sidebar-nav";
import {
   getSidebarDefaultOpen,
   persistSidebarState,
} from "../hooks/use-sidebar-persistence";
import { useTabKeyboardShortcuts } from "../hooks/use-tab-keyboard-shortcuts";
import { useTabRouterSync } from "../hooks/use-tab-router-sync";
import { AppSidebar } from "./app-sidebar";
import { SidebarSubPanel } from "./sidebar-sub-panel";
import { TabBar } from "./tab-bar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
   const { activeOrganization } = useActiveOrganization();
   const { activeTeam, teams } = useActiveTeam();
   const { setLastSlug } = useLastOrganization();
   const queryClient = useQueryClient();
   const setTeamForOrgRef = useRef(new Set<string>());
   const { pathname } = useLocation();

   // Fetch session for PostHog client-side identification
   const { data: session } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   // Disable scroll on main when in settings
   const isSettingsPage = pathname.includes("/settings");

   const orgSlug = activeOrganization?.slug ?? "";
   const teamId = activeTeam?.id ?? "";

   // ── Tab system ───────────────────────────────────────────────────────────

   const homeRoute = `/${orgSlug}/${teamId}/home`;
   const homeParams = { slug: orgSlug, teamId };

   const { navigateToTab, handleCloseTab, openNewSearchTab } = useTabRouterSync(
      orgSlug,
      teamId,
   );

   useTabKeyboardShortcuts({
      onNewTab: openNewSearchTab,
      onTabFocus: navigateToTab,
      homeRoute,
      homeParams,
   });

   // ── Existing effects ─────────────────────────────────────────────────────

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

   // ── PostHog client-side identification ──────────────────────────────────
   useEffect(() => {
      if (session?.user?.id) {
         identifyClient(session.user.id, {
            email: session.user.email,
            name: session.user.name,
         });
      }
      if (activeOrganization?.id) {
         setClientGroup("organization", activeOrganization.id, {
            name: activeOrganization.name,
            slug: activeOrganization.slug,
         });
      }
   }, [
      session?.user?.id,
      session?.user?.email,
      session?.user?.name,
      activeOrganization?.id,
      activeOrganization?.name,
      activeOrganization?.slug,
   ]);

   useEffect(() => {
      if (pathname.includes("/analytics/dashboards")) {
         setActiveSection("dashboards");
      } else if (pathname.includes("/analytics/insights")) {
         setActiveSection("insights");
      } else if (pathname.includes("/analytics/data-management")) {
         setActiveSection("data-management");
      } else {
         setActiveSection(null);
      }
   }, [pathname]);

   return (
      <EarlyAccessProvider>
         <SidebarManagerProvider>
            <SidebarProvider
               className="h-svh"
               defaultOpen={getSidebarDefaultOpen()}
               onOpenChange={persistSidebarState}
            >
               <SidebarManager name="main">
                  <AppSidebar />
               </SidebarManager>

               <SidebarInset className="flex flex-col overflow-hidden">
                  <SidebarSubPanel />
                  <div className="shrink-0">
                     <TabBar
                        onNewTab={openNewSearchTab}
                        onTabClose={handleCloseTab}
                        onTabFocus={navigateToTab}
                     />
                  </div>
                  <main
                     className={cn(
                        "relative flex-1 bg-background p-4 border-white/10 border-t-1",
                        isSettingsPage ? "overflow-hidden" : "overflow-y-auto",
                     )}
                  >
                     {children}
                  </main>
               </SidebarInset>
            </SidebarProvider>
         </SidebarManagerProvider>
      </EarlyAccessProvider>
   );
}
