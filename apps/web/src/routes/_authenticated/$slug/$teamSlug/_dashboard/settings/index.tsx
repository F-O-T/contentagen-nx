import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SettingsMobileNav } from "@/layout/dashboard/ui/settings-mobile-nav";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/",
)({
   component: SettingsIndexRoute,
});

function SettingsIndexRoute() {
   const isMobile = useIsMobile();
   const { slug, teamSlug } = Route.useParams();

   if (!isMobile) {
      return (
         <Navigate
            params={{ slug, teamSlug }}
            replace
            to="/$slug/$teamSlug/settings/project/general"
         />
      );
   }

   return <SettingsMobileNav />;
}
