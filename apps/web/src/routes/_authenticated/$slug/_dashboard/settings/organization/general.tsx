import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/organization/general",
)({
   component: OrgGeneralPage,
});

function OrgGeneralPage() {
   return (
      <SettingsPlaceholderPage
         description="Gerencie o nome, logo e slug da organização."
         title="Geral"
      />
   );
}
