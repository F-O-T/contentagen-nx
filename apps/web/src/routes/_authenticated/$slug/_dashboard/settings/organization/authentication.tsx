import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/organization/authentication",
)({
   component: OrgAuthenticationPage,
});

function OrgAuthenticationPage() {
   return (
      <SettingsPlaceholderPage
         description="Configure domínios de autenticação e login único (SSO)."
         title="Domínios de auth & SSO"
      />
   );
}
