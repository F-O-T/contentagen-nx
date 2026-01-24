import type { RouterOutput } from "@packages/api/client";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { formatDate } from "@packages/utils/date";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreVertical, Shield, Trash2 } from "lucide-react";
import { MemberAvatarCell } from "@/features/organization/ui/shared/member-avatar-cell";
import { RoleBadge } from "@/features/organization/ui/shared/role-badge";

export type Member =
   RouterOutput["organization"]["getActiveOrganizationMembers"][number];

interface MemberActionsProps {
   member: Member;
   onChangeRole?: (member: Member) => void;
   onRemove?: (member: Member) => void;
}

function MemberActionsCell({
   member,
   onChangeRole,
   onRemove,
}: MemberActionsProps) {
   const isOwner = member.role.toLowerCase() === "owner";

   return (
      <div className="flex justify-end">
         <DropdownMenu>
            <Tooltip>
               <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                     <Button size="icon" variant="ghost">
                        <MoreVertical className="size-4" />
                     </Button>
                  </DropdownMenuTrigger>
               </TooltipTrigger>
               <TooltipContent>{"Actions"}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
               <DropdownMenuItem disabled>
                  <Eye className="size-4 mr-2" />
                  {"View"}
               </DropdownMenuItem>
               {!isOwner && onChangeRole && (
                  <DropdownMenuItem onClick={() => onChangeRole(member)}>
                     <Shield className="size-4 mr-2" />
                     {"Change Role"}
                  </DropdownMenuItem>
               )}
               {!isOwner && onRemove && (
                  <>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onRemove(member)}
                     >
                        <Trash2 className="size-4 mr-2" />
                        {"Remove"}
                     </DropdownMenuItem>
                  </>
               )}
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}

export function createMemberColumns(
   onChangeRole?: (member: Member) => void,
   onRemove?: (member: Member) => void,
): ColumnDef<Member>[] {
   return [
      {
         accessorFn: (row) => row.user.name,
         cell: ({ row }) => {
            const member = row.original;
            return (
               <MemberAvatarCell
                  email={member.user.email}
                  image={member.user.image}
                  name={member.user.name}
                  showEmail
               />
            );
         },
         enableSorting: false,
         header: "Name",
         id: "name",
      },
      {
         accessorFn: (row) => row.role,
         cell: ({ row }) => {
            const role = row.original.role;
            return <RoleBadge role={role} />;
         },
         enableSorting: false,
         header: "Role",
         id: "role",
      },
      {
         accessorFn: (row) => row.createdAt,
         cell: ({ row }) => {
            const date = row.original.createdAt;
            return (
               <span className="text-muted-foreground text-sm">
                  {formatDate(new Date(date), "DD MMM YYYY")}
               </span>
            );
         },
         enableSorting: false,
         header: "Joined",
         id: "joined",
      },
      {
         cell: ({ row }) => (
            <MemberActionsCell
               member={row.original}
               onChangeRole={onChangeRole}
               onRemove={onRemove}
            />
         ),
         enableSorting: false,
         header: "",
         id: "actions",
      },
   ];
}
