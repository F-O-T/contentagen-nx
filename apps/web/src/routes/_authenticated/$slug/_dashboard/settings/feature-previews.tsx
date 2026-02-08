import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/feature-previews",
)({
   component: FeaturePreviewsPage,
});

function FeaturePreviewsPage() {
   return (
      <SettingsPlaceholderPage
         description="Ative funcionalidades beta antes do lançamento."
         title="Prévias de funcionalidades"
      />
   );
}
