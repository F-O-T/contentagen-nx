import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { CreateOrganizationCredenza } from "../features/create-organization-credenza";
import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
import { OrganizationPageMembersTable } from "./organization-page-members-table";
import { OrganizationStatsCard } from "./organization-stats-card";
import { OrganizationQuickActions } from "./organization-quick-actions";
import { OrganizationBrandConfigurationCard } from "./organization-brand-configuration-card";

export function OrganizationPage() {
   const [open, setOpen] = useState(false);
   const trpc = useTRPC();
   const { data: org, isLoading: orgLoading } = useSuspenseQuery(
      trpc.authHelpers.getDefaultOrganization.queryOptions(),
   );

   useIsomorphicLayoutEffect(() => {
      if (!org && !orgLoading) setOpen(true);
   }, [org, orgLoading]);

   return (
      <div className="flex flex-col gap-4">
         <TalkingMascot message="Create and manage your organization here. Invite team members and control access." />
         {org ? (
            <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
               <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                  <OrganizationStatsCard />
                  <OrganizationPageMembersTable organization={org} />
               </div>
               <div className="col-span-1 gap-4 flex flex-col">
                  <OrganizationQuickActions organization={org} />
               </div>
            </div>
         ) : (
            <div className="text-muted-foreground">
               No organization found. Please create one to continue.
            </div>
         )}
         <CreateOrganizationCredenza open={open} onOpenChange={setOpen} />
      </div>
   );
}
