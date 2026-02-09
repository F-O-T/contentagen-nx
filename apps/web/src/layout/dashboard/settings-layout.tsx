import { Button } from "@packages/ui/components/button";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
   SidebarInset,
   SidebarManager,
   SidebarProvider,
} from "@packages/ui/components/sidebar";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type * as React from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { SettingsMobileNav } from "./settings-mobile-nav";
import { SettingsSidebar } from "./settings-sidebar";

interface SettingsLayoutProps {
   children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
   const isMobile = useIsMobile();
   const { pathname } = useLocation();
   const { activeOrganization } = useActiveOrganization();

   const isIndexRoute = pathname.endsWith("/settings");

   if (isMobile) {
      if (isIndexRoute) {
         return <SettingsMobileNav />;
      }

      return (
         <div className="flex h-full flex-col gap-4">
            <Button asChild className="w-fit" size="sm" variant="ghost">
               <Link
                  params={{ slug: activeOrganization.slug }}
                  to="/$slug/settings"
               >
                  <ChevronLeft className="size-4 mr-1" />
                  Configurações
               </Link>
            </Button>
            <div className="flex-1">{children}</div>
         </div>
      );
   }

      return (
         <SidebarProvider
            className="min-h-0 w-full"
            style={
               {
                  "--sidebar-width": "16rem",
               } as React.CSSProperties
            }
         >
            <SidebarManager name="settings">
               <Sidebar
                  className="sticky top-0 h-svh border-r"
                  collapsible="none"
               >
                  <SidebarHeader className="px-3 pt-3 pb-0">
                     <div className="flex items-center gap-2">
                        <Button
                           asChild
                           className="w-fit"
                           size="sm"
                           variant="ghost"
                        >
                           <Link
                              params={{ slug: activeOrganization.slug }}
                              to="/$slug/home"
                           >
                              <ChevronLeft className="size-4 mr-1" />
                              Configuracoes
                           </Link>
                        </Button>
                     </div>
                  </SidebarHeader>
                  <SidebarContent>
                     <SettingsSidebar />
                  </SidebarContent>
               </Sidebar>
            </SidebarManager>
            <SidebarInset>
               <main className="flex-1 min-w-0 p-6">{children}</main>
            </SidebarInset>
         </SidebarProvider>
      );
   }
