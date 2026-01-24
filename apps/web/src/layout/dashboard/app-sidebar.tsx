import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { useParams } from "@tanstack/react-router";
import type * as React from "react";
import { NavMain } from "./nav-main";

function ContenttaBranding() {
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? "";

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               asChild
               className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
               size="lg"
            >
               <a href={`/${slug}/home`}>
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
               </a>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   return (
      <Sidebar collapsible="icon" {...props}>
         <SidebarHeader>
            <ContenttaBranding />
         </SidebarHeader>
         <SidebarContent>
            <Separator />
            <NavMain />
         </SidebarContent>
      </Sidebar>
   );
}
