import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardAction,
   CardContent,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import {
   Table,
   TableHeader,
   TableRow,
   TableHead,
   TableBody,
   TableCell,
} from "@packages/ui/components/table";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { useState } from "react";
import type { betterAuthClient } from "@/integrations/clients";
import { SendInvitationCredenza } from "../features/send-invitation-credenza";
export function OrganizationPageMembersTable({
   organization,
}: {
   organization: typeof betterAuthClient.$Infer.ActiveOrganization;
}) {
   const [inviteOpen, setInviteOpen] = useState(false);

   return (
      <>
         <Card className="col-span-2">
            <CardHeader>
               <CardTitle>Organization Members</CardTitle>
               <CardDescription>
                  List of all members in your organization.
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           variant="ghost"
                           size="icon"
                           aria-label="More actions"
                        >
                           <MoreHorizontal className="w-5 h-5" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem
                           onSelect={() => {
                              setInviteOpen(true);
                           }}
                        >
                           <UserPlus className="w-4 h-4 mr-2" /> Invite Members
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </CardAction>
            </CardHeader>
            <CardContent>
               {Array.isArray(organization.members) &&
               organization.members.length > 0 ? (
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Name</TableHead>
                           <TableHead>Email</TableHead>
                           <TableHead>Role</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {organization.members.map((member) => (
                           <TableRow key={member.id || member.user?.email}>
                              <TableCell className="flex items-center gap-2">
                                 {member.user?.image && (
                                    <img
                                       src={member.user.image}
                                       alt={member.user.name || "Avatar"}
                                       className="w-6 h-6 rounded-full"
                                    />
                                 )}
                                 {member.user?.name || "—"}
                              </TableCell>
                              <TableCell>{member.user?.email || "—"}</TableCell>
                              <TableCell>{member.role || "—"}</TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               ) : (
                  <div className="text-muted-foreground">No members found.</div>
               )}
            </CardContent>
         </Card>
         <SendInvitationCredenza
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            organizationId={organization?.id ?? ""}
         />
      </>
   );
}
