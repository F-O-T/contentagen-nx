import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@packages/ui/components/button";
import { Users, Plus, Settings, FileText, Edit, Building2 } from "lucide-react";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Tooltip,
   TooltipTrigger,
   TooltipContent,
} from "@packages/ui/components/tooltip";
import { CreateOrganizationCredenza } from "../features/create-organization-credenza";
import { OrganizationBrandConfigurationCard } from "./organization-brand-configuration-card";
import type { Organization } from "@packages/database/schema";

export function OrganizationQuickActions({ organization }: { organization: Organization }) {
   const router = useRouter();
   const [open, setOpen] = useState(false);
   const [brandConfigOpen, setBrandConfigOpen] = useState(false);

   const actions = [
      {
         icon: Users,
         label: "Invite Members",
         onClick: () => {
            // TODO: Implement invite members functionality
            console.log("Invite members clicked");
         },
         disabled: false,
      },
      {
         icon: Plus,
         label: "Create Agent",
         onClick: () => {
            router.navigate({
               to: "/agents/create",
            });
         },
         disabled: false,
      },
      {
         icon: Settings,
         label: "Organization Settings",
         onClick: () => {
            // TODO: Implement organization settings
            console.log("Organization settings clicked");
         },
         disabled: false,
      },
      {
         icon: FileText,
         label: "View Content",
         onClick: () => {
            router.navigate({
               to: "/content",
            });
         },
         disabled: false,
      },
      {
         icon: Edit,
         label: "Edit Organization",
         onClick: () => {
            // TODO: Implement edit organization
            console.log("Edit organization clicked");
         },
         disabled: false,
      },
      {
         icon: Building2,
         label: "Brand Configuration",
         onClick: () => setBrandConfigOpen(true),
         disabled: false,
      },
   ];

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>Quick Actions</CardTitle>
               <CardDescription>
                  Perform common tasks related to your organization.
               </CardDescription>
            </CardHeader>
            <CardContent className="w-full flex flex-wrap items-center justify-center gap-4">
               {actions.map((action, index) => (
                  <Tooltip key={`org-action-${index + 1}`}>
                     <TooltipTrigger asChild>
                        <Button
                           size="icon"
                           variant="outline"
                           onClick={action.onClick}
                           disabled={action.disabled}
                        >
                           <action.icon />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>{action.label}</TooltipContent>
                  </Tooltip>
               ))}
            </CardContent>
         </Card>

         <CreateOrganizationCredenza open={open} onOpenChange={setOpen} />
         
         <OrganizationBrandConfigurationCard 
            organizationId={organization.id}
            websiteUrl={organization.websiteUrl}
            description={organization.description}
            summary={organization.summary}
            brandKnowledgeStatus={organization.brandKnowledgeStatus || "pending"}
            uploadedFiles={organization.uploadedFiles || []}
            open={brandConfigOpen}
            onOpenChange={setBrandConfigOpen}
         />
      </>
   );
}