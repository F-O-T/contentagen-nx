// apps/web/src/layout/dashboard/app-sidebar.tsx
import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Link, useParams } from "@tanstack/react-router";
import { PanelLeft, Settings } from "lucide-react";
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

         <SidebarContent>
            <Separator />
            <SidebarNav />
         </SidebarContent>

         <SidebarFooter>
            <SidebarFooterContent />
         </SidebarFooter>
      </Sidebar>
   );
}

function SidebarFooterContent() {
   const { toggleSidebar } = useSidebar();
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? "";

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar} tooltip="Recolher menu">
               <PanelLeft />
               <span>Recolher menu</span>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configurações">
               <Link params={{ slug }} to="/$slug/settings">
                  <Settings />
                  <span>Configurações</span>
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <NavUser />
      </SidebarMenu>
   );
}
