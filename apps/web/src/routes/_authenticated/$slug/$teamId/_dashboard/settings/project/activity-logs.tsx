import { createFileRoute } from "@tanstack/react-router";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/project/activity-logs",
)({
   component: ProjectActivityLogsPage,
});

function ProjectActivityLogsPage() {
   return (
      <SettingsAddonGatedPage
         addonName="Scale"
         description="Histórico completo de ações no projeto."
         icon={ScrollText}
         lockedText="O registro de atividades mantém um histórico completo de todas as ações no projeto. Disponível com o addon Scale."
         title="Registro de Atividades"
      />
   );
}
