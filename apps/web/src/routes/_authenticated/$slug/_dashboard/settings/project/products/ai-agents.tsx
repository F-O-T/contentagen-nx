import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/project/products/ai-agents",
)({
   component: ProductsAiAgentsPage,
});

function ProductsAiAgentsPage() {
   return (
      <SettingsPlaceholderPage
         description="Configure as opções do produto de agentes IA."
         title="Agentes IA"
      />
   );
}
