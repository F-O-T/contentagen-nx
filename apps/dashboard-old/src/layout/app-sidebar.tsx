import type { FileRoutesByTo } from "@/routeTree.gen";
import brandConfig from "@packages/brand/index.json";
import logo from "@packages/brand/logo.svg";
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { FilesIcon, LayoutDashboardIcon } from "lucide-react";
import type * as React from "react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

type NavigationItems = {
   url: keyof FileRoutesByTo;
   title: string;
   icon: typeof LayoutDashboardIcon;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
   const navMain: NavigationItems[] = [
      {
         icon: LayoutDashboardIcon,
         title: "Your Agents",
         url: "/agents",
      },
      {
         icon: FilesIcon,
         title: "Your Content",
         url: "/content",
      },
   ];

   return (
      <Sidebar collapsible="offcanvas" {...props}>
         <SidebarHeader>
            <SidebarMenu>
               <SidebarMenuItem>
                  <div className="flex items-center gap-2">
                     <figure className="text-primary">
                        <img
                           alt="Project logo"
                           className="w-8 h-8"
                           src={logo}
                        />
                     </figure>

                     <span className="text-lg font-semibold">
                        {brandConfig.name}
                     </span>
                  </div>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarHeader>
         <SidebarContent>
            <NavMain items={navMain} />
         </SidebarContent>
         <SidebarFooter>
            <NavUser />
         </SidebarFooter>
      </Sidebar>
   );
}
