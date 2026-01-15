import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { Link, useParams } from "@tanstack/react-router";
import type * as React from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { NavMain } from "./nav-main";
import { OrganizationSwitcher } from "./organization-switcher";

function ContenttaBranding() {
   const { slug } = useParams({ strict: false }) as { slug: string };

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               asChild
               className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
               size="lg"
            >
               <Link params={{ slug }} to="/$slug/home">
                  <div className="flex aspect-square size-8 items-center justify-center">
                     <img
                        alt="Contentta Logo"
                        className="h-6 w-6"
                        src="/favicon.svg"
                     />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                     <span className="truncate font-semibold">Contentta</span>
                  </div>
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   const { activeSubscription } = useActiveOrganization();

   const hasProSubscription =
      activeSubscription?.plan?.toLowerCase() === "pro" &&
      (activeSubscription?.status === "active" ||
         activeSubscription?.status === "trialing");

   return (
      <Sidebar collapsible="icon" {...props}>
         <SidebarHeader>
            {hasProSubscription ? (
               <OrganizationSwitcher />
            ) : (
               <ContenttaBranding />
            )}
         </SidebarHeader>
         <SidebarContent>
            <Separator />
            <NavMain />
         </SidebarContent>
      </Sidebar>
   );
}
