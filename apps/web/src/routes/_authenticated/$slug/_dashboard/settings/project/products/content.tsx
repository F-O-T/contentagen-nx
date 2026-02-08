import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/project/products/content",
)({
   component: ProductsContentPage,
});

function ProductsContentPage() {
   return (
      <SettingsPlaceholderPage
         description="Configure as opções do produto de conteúdo."
         title="Conteúdo"
      />
   );
}
