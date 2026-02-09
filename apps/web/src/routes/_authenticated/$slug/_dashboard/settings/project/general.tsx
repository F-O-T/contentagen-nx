import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/project/general",
)({
   component: ProjectGeneralPage,
});

function ProjectGeneralPage() {
   return (
      <SettingsPlaceholderPage
         description="Gerencie o nome, slug e configurações padrão do projeto."
         title="Geral"
      />
   );
}
