import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/project/api-keys",
)({
   component: ProjectApiKeysPage,
});

function ProjectApiKeysPage() {
   return (
      <SettingsPlaceholderPage
         description="Gerencie as chaves de API do projeto para o SDK e a API."
         title="Chaves de API"
      />
   );
}
