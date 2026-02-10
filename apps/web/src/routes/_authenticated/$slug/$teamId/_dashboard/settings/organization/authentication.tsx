import { createFileRoute } from "@tanstack/react-router";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";
import { Globe } from "lucide-react";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/organization/authentication",
)({
   component: OrgAuthenticationPage,
});

function OrgAuthenticationPage() {
   return (
      <SettingsAddonGatedPage
         addonName="Boost"
         description="Configure SSO e domínios de autenticação."
         icon={Globe}
         lockedText="SSO e domínios de autenticação permitem controlar como seus membros fazem login. Disponível com o addon Boost."
         title="Domínios de Auth & SSO"
      />
   );
}
