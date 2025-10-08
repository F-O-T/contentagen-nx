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
import { DeleteOrganizationCredenza } from "../features/delete-organization-credenza";
import { translate } from "@packages/localization";
export function OrganizationPageMembersTable({
   organization,
}: {
   organization: typeof betterAuthClient.$Infer.ActiveOrganization;
}) {
   const [inviteOpen, setInviteOpen] = useState(false);
   const [deleteOpen, setDeleteOpen] = useState(false);
   return (
      <>
         <Card className="col-span-2">
            <CardHeader>
               <CardTitle>
                  {translate("pages.organization.members.title")}
               </CardTitle>
               <CardDescription>
                  Os membros da sua organização e suas funções.
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
                              setDeleteOpen(true);
                           }}
                        >
                           {translate("pages.organization.actions.delete")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                           onSelect={() => {
                              setInviteOpen(true);
                           }}
                        >
                           <UserPlus className="w-4 h-4 mr-2" />{" "}
                           {translate(
                              "pages.organization.actions.invite-member",
                           )}
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
                           <TableHead>
                              {translate("pages.organization.fields.name")}
                           </TableHead>
                           <TableHead>
                              {translate("pages.organization.table.email")}
                           </TableHead>
                           <TableHead>
                              {translate("pages.organization.members.role")}
                           </TableHead>
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
                  <div className="text-muted-foreground">
                     {translate("pages.organization.messages.no-members")}
                  </div>
               )}
            </CardContent>
         </Card>
         <SendInvitationCredenza
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            organizationId={organization?.id ?? ""}
         />
         <DeleteOrganizationCredenza
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            organizationId={organization?.id || ""}
         />
      </>
   );
}
