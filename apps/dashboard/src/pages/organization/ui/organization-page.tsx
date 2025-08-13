import { betterAuthClient } from "@/integrations/clients";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
   CardAction,
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
   TableBody,
   TableHead,
   TableRow,
   TableCell,
} from "@packages/ui/components/table";
import { Button } from "@packages/ui/components/button";
import {
   Building2,
   Users,
   CalendarDays,
   Pencil,
   Trash,
   UserPlus,
   MoreHorizontal,
} from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { CreateOrganizationCredenza } from "../features/create-organization-credenza";
import { InfoItem } from "@packages/ui/components/info-item";

export function OrganizationPage() {
   const [open, setOpen] = useState(false);
   const { data: org, isLoading: orgLoading } = useSuspenseQuery({
      queryKey: ["activeOrganization"],
      queryFn: async () => {
         const { data, error } =
            await betterAuthClient.organization.getFullOrganization();
         if (error) throw new Error("Failed to load organization");
         return data;
      },
   });

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

   // Members are included in the organization object returned by getFullOrganization

   useEffect(() => {
      if (!org && !orgLoading) setOpen(true);
   }, [org, orgLoading]);

   return (
      <div className="flex flex-col gap-4">
         <TalkingMascot message="Create and manage your organization here. Invite team members and control access." />
         {org ? (
            <div
               className="grid grid-cols-3 gap-4"
               style={{ alignItems: "start" }}
            >
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
                                    /* TODO: invite members logic */
                                 }}
                              >
                                 <UserPlus className="w-4 h-4 mr-2" /> Invite
                                 Members
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </CardAction>
                  </CardHeader>
                  <CardContent>
                     {Array.isArray(org.members) && org.members.length > 0 ? (
                        <Table>
                           <TableHeader>
                              <TableRow>
                                 <TableHead>Name</TableHead>
                                 <TableHead>Email</TableHead>
                                 <TableHead>Role</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {org.members.map((member) => (
                                 <TableRow
                                    key={member.id || member.user?.email}
                                 >
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
                                    <TableCell>
                                       {member.user?.email || "—"}
                                    </TableCell>
                                    <TableCell>{member.role || "—"}</TableCell>
                                 </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     ) : (
                        <div className="text-muted-foreground">
                           No members found.
                        </div>
                     )}
                  </CardContent>
               </Card>

               <div className="col-span-1 flex flex-col gap-4">
                  <Card>
                     <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>
                           View your organization info and invite new members.
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
                                       /* TODO: update organization logic */
                                    }}
                                 >
                                    <Pencil className="w-4 h-4 mr-2" /> Update
                                    Organization
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => {
                                       /* TODO: delete organization logic */
                                    }}
                                 >
                                    <Trash className="w-4 h-4 mr-2" /> Delete
                                    Organization
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </CardAction>
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
