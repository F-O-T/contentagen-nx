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
import { Building2, MoreVertical } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
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

   return (
      <div className="flex flex-col gap-4">
         <TalkingMascot message="Create and manage your organizations here. Invite team members and their control access" />
         <Card>
            <CardHeader>
               <CardTitle>Organizations</CardTitle>
               <CardDescription>
                  Manage your organizations, invite members, and control access.
                  Powered by Better Auth integration.
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           variant="ghost"
                           size="icon"
                           aria-label="More actions"
                        >
                           <MoreVertical className="w-5 h-5" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setOpen(true)}>
                           <Building2 />
                           Create Organization
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </CardAction>
            </CardHeader>
            <CardContent>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="w-8" />
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {data.map((org: any) => (
                        <TableRow key={org.id}>
                           <TableCell>
                              {org.name || (
                                 <span className="text-muted-foreground">
                                    —
                                 </span>
                              )}
                           </TableCell>
                           <TableCell>{org.members?.length ?? "—"}</TableCell>
                           <TableCell>
                              {org.createdAt
                                 ? new Date(org.createdAt).toLocaleString()
                                 : "—"}
                           </TableCell>
                           <TableCell className="text-right">
                              <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       aria-label="Organization actions"
                                    >
                                       <MoreVertical className="w-5 h-5" />
                                    </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                       className="text-red-600"
                                       onSelect={() => {
                                          /* TODO: implement delete logic */
                                       }}
                                    >
                                       Delete
                                    </DropdownMenuItem>
                                 </DropdownMenuContent>
                              </DropdownMenu>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
         <CreateOrganizationCredenza open={open} onOpenChange={setOpen} />
      </div>
   );
}
