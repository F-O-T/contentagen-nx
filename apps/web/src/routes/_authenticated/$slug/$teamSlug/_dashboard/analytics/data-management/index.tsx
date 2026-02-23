import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { DataManagementMobileNav } from "@/layout/dashboard/ui/data-management-mobile-nav";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/data-management/",
)({
   component: DataManagementIndexRoute,
});

function DataManagementIndexRoute() {
   const isMobile = useIsMobile();
   const { slug, teamSlug } = Route.useParams();

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
