import { SidebarInset, SidebarProvider } from "@packages/ui/components/sidebar";
import type * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

import type { Session } from "@/integrations/clients";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useSubscriptionReminder } from "@/features/subscription-reminder/lib/use-subscription-reminder";

export function DashboardLayout({
   children,
   session,
}: {
   children: React.ReactNode;
   session: Session | null;
}) {
   const trpc = useTRPC();
   const { data: customerState } = useSuspenseQuery(
      trpc.authHelpers.getCustomerState.queryOptions(),
   );

   const hasActiveSubscription = Boolean(customerState?.activeSubscriptions[0]);
   const { SubscriptionReminderComponent } = useSubscriptionReminder(hasActiveSubscription);

   return (
      <SidebarProvider>
         <AppSidebar variant="inset" session={session} />
         <SidebarInset>
            <SiteHeader />
            <div className="p-4 h-full flex-1 overflow-y-auto">{children}</div>
         </SidebarInset>
         <SubscriptionReminderComponent />
      </SidebarProvider>
   );
}
