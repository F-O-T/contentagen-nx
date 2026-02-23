import { Button } from "@packages/ui/components/button";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type * as React from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { DataManagementMobileNav } from "./data-management-mobile-nav";

interface DataManagementLayoutProps {
   children: React.ReactNode;
}

export function DataManagementLayout({ children }: DataManagementLayoutProps) {
   const isMobile = useIsMobile();
   const { pathname } = useLocation();
   const { activeOrganization } = useActiveOrganization();
   const { teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   const isIndexRoute = pathname.endsWith("/data-management");

   if (isMobile) {
      if (isIndexRoute) {
         return <DataManagementMobileNav />;
      }

      return (
         <div className="flex h-full flex-col gap-4">
            <Button asChild className="w-fit" size="sm" variant="ghost">
               <Link
                  params={{
                     slug: activeOrganization.slug,
                     teamSlug: teamSlug ?? "",
                  }}
                  to="/$slug/$teamSlug/analytics/data-management"
               >
                  <ChevronLeft className="size-4 mr-1" />
                  Gerenciamento de Dados
               </Link>
            </Button>
            <div className="flex-1">{children}</div>
         </div>
      );
   }

   return <>{children}</>;
}
