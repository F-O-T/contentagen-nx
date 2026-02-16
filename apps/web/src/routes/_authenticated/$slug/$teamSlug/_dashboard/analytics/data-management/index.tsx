import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { DataManagementMobileNav } from "@/layout/dashboard/ui/data-management-mobile-nav";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/data-management/",
)({
   component: DataManagementIndexRoute,
});

function DataManagementIndexRoute() {
   const isMobile = useIsMobile();
   const { slug, teamSlug } = useParams({ strict: false }) as {
      slug: string;
      teamSlug: string;
   };

   if (!isMobile) {
      return (
         <Navigate
            params={{ slug, teamSlug }}
            replace
            to="/$slug/$teamSlug/analytics/data-management/event-definitions"
         />
      );
   }

   return <DataManagementMobileNav />;
}
