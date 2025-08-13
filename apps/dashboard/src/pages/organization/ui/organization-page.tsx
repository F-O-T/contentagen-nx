import { betterAuthClient } from "@/integrations/clients";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
   CardAction,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { Building2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { CreateOrganizationCredenza } from "../features/create-organization-credenza";

export function OrganizationPage() {
   const [open, setOpen] = useState(false);
   const { data } = useSuspenseQuery({
      queryKey: ["organizations"],
      queryFn: async () => {
         const { data, error } = await betterAuthClient.organization.list();
         if (error) throw new Error("Failed to load organizations");
         return data;
      },
   });

   // Only allow one organization per user
   const org = data?.[0];

   // Auto-open credenza if no org exists
   useEffect(() => {
      if (!org) setOpen(true);
   }, [org]);

   return (
      <div className="flex flex-col gap-4">
         <TalkingMascot message="Create and manage your organization here. Invite team members and control access." />
         <Card>
            <CardHeader>
               <CardTitle>Organization</CardTitle>
               <CardDescription>
                  Manage your organization, invite members, and control access.
                  Powered by Better Auth integration.
               </CardDescription>
               <CardAction>
                  {/* Only show create button if no org exists */}
                  {!org && (
                     <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Create Organization"
                        onClick={() => setOpen(true)}
                     >
                        <Building2 className="w-5 h-5" />
                     </Button>
                  )}
               </CardAction>
            </CardHeader>
            <CardContent>
               {/* If org exists, show its info. Otherwise, prompt to create. */}
               {org ? (
                  <div className="flex flex-col gap-2">
                     <div>
                        <strong>Name:</strong> {org.name}
                     </div>
                     <div>
                        <strong>Members:</strong>{" "}
                        {"members" in org && Array.isArray((org as any).members)
                           ? (org as any).members.length
                           : "—"}
                     </div>
                     <div>
                        <strong>Created At:</strong>{" "}
                        {org.createdAt
                           ? new Date(org.createdAt).toLocaleString()
                           : "—"}
                     </div>
                  </div>
               ) : (
                  <div className="text-muted-foreground">
                     No organization found. Please create one to continue.
                  </div>
               )}
            </CardContent>
         </Card>
         <CreateOrganizationCredenza open={open} onOpenChange={setOpen} />
      </div>
   );
}
