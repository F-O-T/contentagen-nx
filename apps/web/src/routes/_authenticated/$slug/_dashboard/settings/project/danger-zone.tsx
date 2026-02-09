import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/project/danger-zone",
)({
   component: ProjectDangerZonePage,
});

function ProjectDangerZonePage() {
   return (
      <SettingsPlaceholderPage
         description="Ações irreversíveis para este projeto."
         title="Zona de perigo"
      />
   );
}
