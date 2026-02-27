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
import { GlobalContextPanel } from "@/features/context-panel/context-panel";
import { useApiErrorTracker } from "@/features/feedback/hooks/use-api-error-tracker";
import { BugReportForm } from "@/features/feedback/ui/bug-report-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useActiveTeam } from "@/hooks/use-active-team";
import { useCredenza } from "@/hooks/use-credenza";
import { EarlyAccessProvider } from "@/hooks/use-early-access";
import { useLastOrganization } from "@/hooks/use-last-organization";
import { useSafeLocalStorage } from "@/hooks/use-local-storage";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import { AppSidebar } from "./app-sidebar";
import { SidebarSubPanel } from "./sidebar-sub-panel";

function AutoBugReporter() {
   const { openCredenza, closeCredenza } = useCredenza();
   const { shouldShowBugReport, dismiss } = useApiErrorTracker();

   useEffect(() => {
      if (shouldShowBugReport) {
         openCredenza({
            children: (
               <BugReportForm
                  onSuccess={() => {
                     dismiss();
                     closeCredenza();
                  }}
               />
            ),
         });
      }
   }, [shouldShowBugReport, openCredenza, closeCredenza, dismiss]);

   return null;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
   const { activeOrganization } = useActiveOrganization();
   const { activeTeam, teams } = useActiveTeam();
   const { setLastSlug } = useLastOrganization();
   const queryClient = useQueryClient();
   const setTeamForOrgRef = useRef(new Set<string>());
   const { pathname } = useLocation();

   const [sidebarCollapsed, setSidebarCollapsed] = useSafeLocalStorage<boolean>(
      "contentta:sidebar-collapsed",
      false,
   );
   const sidebarOpen = !sidebarCollapsed;
   const handleSidebarChange = (open: boolean) => {
      setSidebarCollapsed(!open);
   };

   // Fetch session for PostHog client-side identification
   const { data: session } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   // Disable scroll on main when in settings
   const isSettingsPage = pathname.includes("/settings");
   const isEditorPage =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
         pathname.split("/").at(-1) ?? "",
      );
   const isChatPage = pathname.includes("/chat");

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

   return (
      <EarlyAccessProvider>
         <SidebarManagerProvider>
            <SidebarProvider
               className="h-svh"
               onOpenChange={handleSidebarChange}
               open={sidebarOpen}
            >
               <SidebarManager
                  name="main"
                  style={
                     {
                        "--sidebar-width": "28rem",
                     } as React.CSSProperties
                  }
               >
                  <AppSidebar />
               </SidebarManager>

               <SidebarInset className="flex flex-col overflow-hidden bg-sidebar">
                  <SidebarSubPanel />
                  <div className=" flex flex-1 flex-col overflow-hidden rounded-xl bg-background">
                     <main
                        className={cn(
                           "relative flex-1",
                           isEditorPage || isChatPage
                              ? "overflow-hidden "
                              : isSettingsPage
                                ? "overflow-hidden p-4"
                                : "overflow-y-auto p-4",
                        )}
                     >
                        {children}
                     </main>
                  </div>
                  <AutoBugReporter />
               </SidebarInset>
               <GlobalContextPanel />
            </SidebarProvider>
         </SidebarManagerProvider>
      </EarlyAccessProvider>
   );
}
