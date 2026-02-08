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
import { useParams } from "@tanstack/react-router";
import { PanelLeft, Settings } from "lucide-react";
import type * as React from "react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { SidebarScopeSwitcher } from "./sidebar-scope-switcher";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   return (
      <Sidebar collapsible="icon" {...props}>
         <SidebarHeader>
            <SidebarScopeSwitcher />
         </SidebarHeader>
         <SidebarContent>
            <Separator />
            <NavMain />
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
            <SidebarMenuButton onClick={toggleSidebar} tooltip="Collapse nav">
               <PanelLeft />
               <span>Collapse nav</span>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
               <a href={`/${slug}/settings`}>
                  <Settings />
                  <span>Settings</span>
               </a>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <NavUser />
      </SidebarMenu>
   );
}
