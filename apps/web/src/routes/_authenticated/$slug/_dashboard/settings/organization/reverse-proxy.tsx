import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/organization/reverse-proxy",
)({
   component: OrgReverseProxyPage,
});

function OrgReverseProxyPage() {
   return (
      <SettingsPlaceholderPage
         description="Configure um proxy reverso gerenciado para o seu domínio."
         title="Proxy reverso gerenciado"
      />
   );
}
