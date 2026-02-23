import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarGroup,
   SidebarGroupContent,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { PanelLeft, PanelLeftClose, Search, Settings } from "lucide-react";
import type * as React from "react";
import { useCallback } from "react";
import { replaceCurrentTab, tabStore } from "@/hooks/use-tab-store";
import { EarlyAccessSidebarBanner } from "./early-access-sidebar-banner";
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
            <SidebarSearchButton />
            <Separator />

            <SidebarNav />
         </SidebarContent>

         <SidebarFooter>
            <EarlyAccessSidebarBanner />
            <Separator />

            <SidebarFooterContent />
         </SidebarFooter>
      </Sidebar>
   );
}

function SidebarSearchButton() {
   const params = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const slug = params.slug ?? "";
   const teamSlug = params.teamSlug ?? "";
   const navigate = useNavigate();

   const handleSearch = useCallback(() => {
      const route = "/$slug/$teamSlug/search";
      const params = { slug, teamSlug };

      // Replace current tab with search (don't open a new tab)
      if (tabStore.state.activeTabId) {
         replaceCurrentTab({
            route,
            params,
            label: "Pesquisar",
            icon: "Search",
            type: "search",
         });
      }

      navigate({ to: route, params });
   }, [navigate, slug, teamSlug]);

   return (
      <SidebarGroup className="py-0">
         <SidebarGroupContent>
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSearch} tooltip="Pesquisar">
                     <Search />
                     <span>Pesquisar</span>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}

function SidebarFooterContent() {
   const params = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const slug = params.slug ?? "";
   const teamSlug = params.teamSlug ?? "";
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
               <Link params={{ slug, teamSlug }} to="/$slug/$teamSlug/settings">
                  <Settings />
                  <span>Configuracoes</span>
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <NavUser />
      </SidebarMenu>
   );
}
