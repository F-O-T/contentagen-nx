import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
   SidebarInset,
   SidebarManager,
   SidebarProvider,
} from "@packages/ui/components/sidebar";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import { ChevronLeft, Search } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { SettingsMobileNav } from "./settings-mobile-nav";
import { SettingsSidebar } from "./settings-sidebar";

interface SettingsLayoutProps {
   children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
   const isMobile = useIsMobile();
   const { pathname } = useLocation();
   const { teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const { activeOrganization } = useActiveOrganization();
   const [search, setSearch] = useState("");

   const isIndexRoute = pathname.endsWith("/settings");

   if (isMobile) {
      if (isIndexRoute) {
         return <SettingsMobileNav />;
      }

      return (
         <div className="flex h-full flex-col gap-4">
            <Button asChild className="w-fit" size="sm" variant="ghost">
               <Link
                  params={{ slug: activeOrganization.slug, teamSlug }}
                  to="/$slug/$teamSlug/settings"
               >
                  <ChevronLeft className="size-4 mr-1" />
                  Configuracoes
               </Link>
            </Button>
            <div className="flex-1">{children}</div>
         </div>
      );
   }

   return (
      <SidebarProvider
         className="!absolute !inset-0  !min-h-0 !h-full border-l border-white/10 bg-sidebar shadow-xl"
         style={
            {
               "--sidebar-width": "16rem",
            } as React.CSSProperties
         }
      >
         <SidebarManager name="settings">
            <Sidebar className="border-r" collapsible="none">
               <SidebarHeader className="px-3 pt-3 pb-0">
                  <div className="relative">
                     <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                     <Input
                        className="pl-8 h-9 bg-sidebar text-sm"
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Pesquisar configurações..."
                        value={search}
                     />
                  </div>
               </SidebarHeader>
               <SidebarContent>
                  <SettingsSidebar search={search} />
               </SidebarContent>
            </Sidebar>
         </SidebarManager>
         <SidebarInset className="flex-1 overflow-y-auto">
            <main className="p-4">{children}</main>
         </SidebarInset>
      </SidebarProvider>
   );
}
