import { createFileRoute } from "@tanstack/react-router";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";
import { UserCog } from "lucide-react";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/organization/roles",
)({
   component: OrgRolesPage,
});

function OrgRolesPage() {
   return (
      <SettingsAddonGatedPage
         addonName="Boost"
         description="Crie e gerencie funções customizadas para sua organização."
         icon={UserCog}
         lockedText="Funções customizadas permitem criar papéis específicos para sua organização. Disponível com o addon Boost."
         title="Funções"
      />
   );
}
