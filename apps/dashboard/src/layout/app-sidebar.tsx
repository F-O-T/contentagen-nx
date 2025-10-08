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
import {
   Bot,
   FilesIcon,
   type LayoutDashboardIcon,
   Lightbulb,
   Target,
   FileText,
   Building2,
   Users,
} from "lucide-react";
import type * as React from "react";
import { Link } from "@tanstack/react-router";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import type { Session } from "@/integrations/clients";

type NavigationItems = {
   url?: keyof FileRoutesByTo;
   title: string;
   icon: typeof LayoutDashboardIcon;
   subItems?: {
      url: keyof FileRoutesByTo;
      title: string;
      icon?: typeof LayoutDashboardIcon;
   }[];
};

export function AppSidebar({
   session,
   ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session | null }) {
   const navMain: NavigationItems[] = [
      {
         icon: FilesIcon,
         title: "Content",
         subItems: [
            {
               url: "/agents",
               title: "Content Agents",
               icon: Bot,
            },
            {
               url: "/ideas",
               title: "Content Ideas",
               icon: Lightbulb,
            },
            {
               url: "/content",
               title: "Created Content",
               icon: FileText,
            },
         ],
      },
      {
         icon: Target,
         title: "Competitors",
         url: "/competitors",
      },
      {
         icon: Building2,
         title: "Organization",
         subItems: [
            {
               url: "/organization",
               title: "Organization Overview",
               icon: Building2,
            },
            {
               url: "/organization/members",
               title: "Members",
               icon: Users,
            },
            {
               url: "/organization/brand",
               title: "Brand Files",
               icon: FileText,
            },
         ],
      },
   ];

   return (
      <Sidebar collapsible="offcanvas" {...props}>
         <SidebarHeader>
            <SidebarMenu>
               <SidebarMenuItem>
                  <Link to="/home" className="flex items-center gap-2">
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
                  </Link>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarHeader>
         <SidebarContent>
            <NavMain items={navMain} />
         </SidebarContent>
         <SidebarFooter>
            <NavUser session={session} />
         </SidebarFooter>
      </Sidebar>
   );
}
