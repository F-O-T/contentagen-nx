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
import { FileTextIcon, LayoutDashboardIcon } from "lucide-react";
import type * as React from "react";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const data = {
   navMain: [
      {
         icon: LayoutDashboardIcon,
         title: "Agents",
         url: "/agents",
      },
      {
         icon: FileTextIcon,
         title: "Content",
         url: "/content",
      },
   ],
   user: {
      avatar: "/avatars/shadcn.jpg",
      email: "m@example.com",
      name: "shadcn",
   },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
            <NavMain items={data.navMain} />
         </SidebarContent>
         <SidebarFooter>
            <NavUser />
         </SidebarFooter>
      </Sidebar>
   );
}
