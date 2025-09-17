import { useTRPC } from "@/integrations/clients";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";
import { Building2, Users, CalendarDays } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { CreateOrganizationCredenza } from "../features/create-organization-credenza";
import { InfoItem } from "@packages/ui/components/info-item";
import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
import { OrganizationPageMembersTable } from "./organization-page-members-table";
import { OrganizationKnowledgeBaseCard } from "./organization-knowledge-base-card";

export function OrganizationPage() {
   const [open, setOpen] = useState(false);
   const trpc = useTRPC();
   const { data: org, isLoading: orgLoading } = useSuspenseQuery(
      trpc.authHelpers.getDefaultOrganization.queryOptions(),
   );

   const detailsInfoItems = useMemo(
      () => [
         {
            label: "Name",
            value: org?.name ?? "—",
            icon: <Building2 className="w-4 h-4" />,
         },
         {
            label: "Created At",
            value: org?.createdAt
               ? new Date(org.createdAt).toLocaleString()
               : "—",
            icon: <CalendarDays className="w-4 h-4" />,
         },
         {
            label: "Members",
            value: Array.isArray(org?.members)
               ? String(org.members.length)
               : "—",
            icon: <Users className="w-4 h-4" />,
         },
      ],
      [org],
   );

   useIsomorphicLayoutEffect(() => {
      if (!org && !orgLoading) setOpen(true);
   }, [org, orgLoading]);

   return (
      <div className="flex flex-col gap-4">
         <TalkingMascot message="Create and manage your organization here. Invite team members and control access." />
         {org ? (
            <div className="grid  grid-cols-3 gap-4">
               <OrganizationPageMembersTable organization={org} />

               <div className="col-span-1 flex flex-col gap-4">
                  <Card>
                     <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>
                           View your organization info and invite new members.
                        </CardDescription>
                     </CardHeader>
                     <CardContent className="grid gap-2">
                        {detailsInfoItems.map((item) => (
                           <InfoItem
                              key={item.label}
                              icon={item.icon}
                              label={item.label}
                              value={item.value}
                           />
                        ))}
                     </CardContent>
                  </Card>
                  
                  <OrganizationKnowledgeBaseCard 
                     organizationId={org.id}
                     uploadedFiles={org.uploadedFiles || []}
                     brandKnowledgeStatus={org.brandKnowledgeStatus || "pending"}
                  />
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
