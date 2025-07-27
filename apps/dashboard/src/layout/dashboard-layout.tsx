import { SidebarInset, SidebarProvider } from "@packages/ui/components/sidebar";
import type * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

import type { Session } from "@/integrations/clients";

export function DashboardLayout({
   children,
   session,
}: {
   children: React.ReactNode;
   session: Session | null;
}) {
   return (
      <SidebarProvider>
         <AppSidebar variant="inset" session={session} />
         <SidebarInset>
            <SiteHeader />
            {/* You can now use the session prop here, e.g. show user info */}
            <div className="p-4 h-full flex-1 overflow-y-auto">
               {/* Example: <pre>{JSON.stringify(session, null, 2)}</pre> */}
               {children}
            </div>
         </SidebarInset>
      </SidebarProvider>
   );
}
