import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarRail,
   SidebarSeparator,
   SidebarTrigger,
} from "@packages/ui/components/sidebar";
import { Link, useParams } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import type * as React from "react";
import { NavUser } from "./nav-user";
import { SidebarNav } from "./sidebar-nav";
import { SidebarScopeSwitcher } from "./sidebar-scope-switcher";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   return (
      <Sidebar collapsible="icon" {...props}>
         <SidebarHeader>
            <SidebarScopeSwitcher />
         </SidebarHeader>

         <SidebarSeparator />

         <SidebarContent>
            <SidebarNav />
         </SidebarContent>

         <SidebarFooter>
            <SidebarFooterContent />
         </SidebarFooter>

         <SidebarRail />
      </Sidebar>
   );
}

function SidebarFooterContent() {
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? "";

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configuracoes">
               <Link params={{ slug }} to="/$slug/settings">
                  <Settings />
                  <span>Configuracoes</span>
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <NavUser />
         <SidebarMenuItem>
            <SidebarTrigger className="w-full" />
         </SidebarMenuItem>
      </SidebarMenu>
   );
}
