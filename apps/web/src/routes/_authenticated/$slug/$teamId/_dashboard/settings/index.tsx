import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { SettingsMobileNav } from "@/layout/dashboard/ui/settings-mobile-nav";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/",
)({
   component: SettingsIndexRoute,
});

function SettingsIndexRoute() {
   const isMobile = useIsMobile();
   const { slug, teamId } = useParams({ strict: false }) as {
      slug: string;
      teamId: string;
   };

   if (!isMobile) {
      return (
         <Navigate
            params={{ slug, teamId }}
            replace
            to="/$slug/$teamId/settings/project/general"
         />
      );
   }

   return <SettingsMobileNav />;
}
