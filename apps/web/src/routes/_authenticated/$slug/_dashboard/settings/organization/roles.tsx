import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/organization/roles",
)({
   component: OrgRolesPage,
});

function OrgRolesPage() {
   return (
      <SettingsPlaceholderPage
         description="Crie e gerencie funções de permissão personalizadas."
         title="Funções"
      />
   );
}
