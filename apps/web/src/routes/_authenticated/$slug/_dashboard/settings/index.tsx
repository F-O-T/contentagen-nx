import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { SettingsMobileNav } from "@/layout/dashboard/ui/settings-mobile-nav";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/",
)({
   component: SettingsIndexRoute,
});

function SettingsIndexRoute() {
   const isMobile = useIsMobile();
   const { slug } = useParams({ strict: false }) as { slug: string };

   if (!isMobile) {
      return (
         <Navigate
            params={{ slug }}
            replace
            to="/$slug/settings/project/general"
         />
      );
   }

   return <SettingsMobileNav />;
}
