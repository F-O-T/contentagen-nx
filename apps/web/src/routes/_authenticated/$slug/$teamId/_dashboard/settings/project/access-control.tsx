import { createFileRoute } from "@tanstack/react-router";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/project/access-control",
)({
   component: ProjectAccessControlPage,
});

function ProjectAccessControlPage() {
   return (
      <SettingsAddonGatedPage
         addonName="Boost"
         description="Defina permissões granulares por projeto."
         icon={ShieldCheck}
         lockedText="Controle de acesso granular permite definir quem pode fazer o quê dentro de cada projeto. Disponível com o addon Boost."
         title="Controle de Acesso"
      />
   );
}
