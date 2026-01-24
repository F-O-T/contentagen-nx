import { DefaultHeader } from "@/default/default-header";
import { InvitesListSection } from "./organization-invites-list-section";
import { InvitesQuickActionsToolbar } from "./organization-invites-quick-actions-toolbar";

export function OrganizationInvitesPage() {
   return (
      <main className="flex flex-col gap-4">
         <DefaultHeader
            actions={<InvitesQuickActionsToolbar />}
            description={"Description"}
            title={"Title"}
         />
         <InvitesListSection />
      </main>
   );
}
