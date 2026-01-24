import { SidebarInset, SidebarProvider } from "@packages/ui/components/sidebar";
import { cn } from "@packages/ui/lib/utils";
import type * as React from "react";
import { useEffect } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useLastOrganization } from "@/hooks/use-last-organization";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
   const { activeOrganization } = useActiveOrganization();
   const { setLastSlug } = useLastOrganization();

   useEffect(() => {
      if (activeOrganization?.slug) {
         setLastSlug(activeOrganization.slug);
      }
   }, [activeOrganization?.slug, setLastSlug]);

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
