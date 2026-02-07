import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
} from "@packages/ui/components/sidebar";
import type * as React from "react";
import { NavMain } from "./nav-main";
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
      </Sidebar>
   );
}
