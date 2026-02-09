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
import { PanelLeft, PanelLeftClose, Settings } from "lucide-react";
import type * as React from "react";
import { NavUser } from "./nav-user";
import { SidebarNav } from "./sidebar-nav";
import { SidebarScopeSwitcher } from "./sidebar-scope-switcher";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   return (
      <Sidebar
         className="border-r-0 group-data-[side=left]:border-r-0"
         collapsible="icon"
         {...props}
      >
         <SidebarHeader>
            <SidebarScopeSwitcher />
         </SidebarHeader>

         <SidebarContent>
            <SidebarNav />
         </SidebarContent>

         <SidebarFooter>
            <SidebarFooterContent />
         </SidebarFooter>
      </Sidebar>
   );
}

function SidebarFooterContent() {
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? "";
   const { toggleSidebar, state } = useSidebar();

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               onClick={toggleSidebar}
               tooltip={state === "expanded" ? "Ocultar" : "Abrir"}
            >
               {state === "expanded" ? <PanelLeftClose /> : <PanelLeft />}
               <span>Ocultar</span>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configuracoes">
               <Link params={{ slug }} to="/$slug/settings">
                  <Settings />
                  <span>Configuracoes</span>
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <NavUser />
      </SidebarMenu>
   );
}
