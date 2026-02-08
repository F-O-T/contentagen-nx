import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/organization/members",
)({
   component: OrgMembersPage,
});

function OrgMembersPage() {
   return (
      <SettingsPlaceholderPage
         description="Convide e gerencie os membros da organização."
         title="Membros"
      />
   );
}
