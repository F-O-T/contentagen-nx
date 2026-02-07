import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { useLocation } from "@tanstack/react-router";
import {
   BarChart3,
   ClipboardList,
   Database,
   FileText,
   Home,
   LayoutDashboard,
   Lightbulb,
} from "lucide-react";

export function NavMain() {
   const { pathname, searchStr } = useLocation();
   const { state } = useSidebar();
   const slug = pathname.split("/")[1] || "";

   const isActive = (url: string) => {
      if (!url) return false;

      const resolvedUrl = url.replace("$slug", slug);

      if (resolvedUrl.includes("?")) {
         const [path, params] = resolvedUrl.split("?");
         return pathname === path && searchStr === `?${params}`;
      }

      return pathname.startsWith(resolvedUrl) && !searchStr;
   };

   const getResolvedUrl = (url: string) => {
      return url.replace("$slug", slug);
   };

   const mainItems = [
      {
         icon: Home,
         id: "home",
         title: "Início",
         url: "/$slug/home",
      },

      {
         icon: FileText,
         id: "content",
         title: "Conteúdos",
         url: "/$slug/content",
      },

      {
         icon: ClipboardList,
         id: "forms",
         title: "Formulários",
         url: "/$slug/forms",
      },
   ];

   const analyticsItems = [
      {
         icon: LayoutDashboard,
         id: "dashboards",
         title: "Dashboards",
         url: "/$slug/analytics/dashboards",
      },

      {
         icon: Lightbulb,
         id: "insights",
         title: "Insights",
         url: "/$slug/analytics/insights",
      },

      {
         icon: Database,
         id: "data-management",
         title: "Dados",
         url: "/$slug/analytics/data-management",
      },
   ];

   const renderNavItem = (item: {
      icon: typeof Home;
      id: string;
      title: string;
      url: string;
   }) => {
      const Icon = item.icon;

      return (
         <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
               asChild
               className={
                  isActive(item.url)
                     ? "bg-primary/10 text-primary rounded-lg"
                     : ""
               }
               tooltip={item.title}
            >
               <a href={getResolvedUrl(item.url)}>
                  <Icon />
                  <span>{item.title}</span>
               </a>
            </SidebarMenuButton>
         </SidebarMenuItem>
      );
   };

   return (
      <>
         <SidebarGroup className="group-data-[collapsible=icon]">
            <SidebarGroupContent className="flex flex-col gap-2">
               {state === "expanded" && (
                  <SidebarGroupLabel>{"Principal"}</SidebarGroupLabel>
               )}
               <SidebarMenu>
                  {mainItems.map((item) => renderNavItem(item))}
               </SidebarMenu>
            </SidebarGroupContent>
         </SidebarGroup>

         <SidebarGroup className="group-data-[collapsible=icon]">
            <SidebarGroupContent className="flex flex-col gap-2">
               {state === "expanded" && (
                  <SidebarGroupLabel>
                     <BarChart3 className="size-3.5 mr-1.5 inline" />
                     {"Analytics"}
                  </SidebarGroupLabel>
               )}
               <SidebarMenu>
                  {analyticsItems.map((item) => renderNavItem(item))}
               </SidebarMenu>
            </SidebarGroupContent>
         </SidebarGroup>
      </>
   );
}
