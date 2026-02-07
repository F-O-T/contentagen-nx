import { SidebarInset, SidebarProvider } from "@packages/ui/components/sidebar";
import { cn } from "@packages/ui/lib/utils";
import type * as React from "react";
import { useEffect, useRef } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useActiveTeam } from "@/hooks/use-active-team";
import { useLastOrganization } from "@/hooks/use-last-organization";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
   const { activeOrganization } = useActiveOrganization();
   const { activeTeam, teams } = useActiveTeam();
   const { setLastSlug } = useLastOrganization();
   const queryClient = useQueryClient();
   const setTeamForOrgRef = useRef(new Set<string>());

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

   return (
      <SidebarProvider defaultOpen={false}>
         <AppSidebar variant="inset" />
         <SidebarInset>
            <SiteHeader />
            <div className={cn("p-4 h-full flex-1 overflow-y-auto")}>
               {children}
            </div>
         </SidebarInset>
      </SidebarProvider>
   );
}
