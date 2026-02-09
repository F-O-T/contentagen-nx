import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/project/activity-logs",
)({
   component: ProjectActivityLogsPage,
});

function ProjectActivityLogsPage() {
   return (
      <SettingsPlaceholderPage
         description="Visualize o histórico de ações neste projeto."
         title="Registro de atividades"
      />
   );
}
