import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/danger-zone",
)({
   component: AccountDangerZonePage,
});

function AccountDangerZonePage() {
   return (
      <SettingsPlaceholderPage
         description="Ações irreversíveis para sua conta."
         title="Zona de perigo"
      />
   );
}
