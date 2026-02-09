import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/organization/security",
)({
   component: OrgSecurityPage,
});

function OrgSecurityPage() {
   return (
      <SettingsPlaceholderPage
         description="Políticas e configurações de segurança da organização."
         title="Segurança"
      />
   );
}
