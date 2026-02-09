import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/organization/danger-zone",
)({
   component: OrgDangerZonePage,
});

function OrgDangerZonePage() {
   return (
      <SettingsPlaceholderPage
         description="Ações irreversíveis para esta organização."
         title="Zona de perigo"
      />
   );
}
