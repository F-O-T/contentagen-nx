import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { DataTable } from "@packages/ui/components/data-table";
import { Input } from "@packages/ui/components/input";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import { getInitials } from "@packages/utils/text";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, ShieldCheck } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";

type MemberRow = {
   id: string;
   name: string;
   email: string;
   role: string;
   image: string | null;
   hasAccess: boolean;
};

const ROLE_LABELS: Record<string, string> = {
   owner: "Proprietário",
   admin: "Administrador",
   member: "Membro",
};

function getRoleBadgeVariant(
   role: string,
): "default" | "secondary" | "outline" {
   if (role === "owner") return "default";
   if (role === "admin") return "secondary";
   return "outline";
}

function AccessControlSkeleton() {
   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <Skeleton className="h-8 w-48" />
               <Skeleton className="h-4 w-96 mt-1" />
            </div>
         </div>
         <Skeleton className="h-9 w-full" />
         <div className="space-y-1">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
         </div>
      </div>
   );
}

function AccessControlErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Controle de Acesso
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie quem pode acessar este projeto.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar o controle de acesso
            </p>
            <Button onClick={resetErrorBoundary} variant="outline">
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

function AccessControlContent({ teamId }: { teamId: string }) {
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();
   const [searchFilter, setSearchFilter] = useState("");

   // Get all organization members
   const { data: orgMembers } = useSuspenseQuery(
      orpc.organization.getMembers.queryOptions({}),
   );

   // Get team members
   const { data: teamMembers } = useSuspenseQuery(
      orpc.team.getMembers.queryOptions({ input: { teamId } }),
   );

   const teamMemberIds = new Set(teamMembers.map((m) => m.id));

   // Combine data
   const members: MemberRow[] = useMemo(
      () =>
         orgMembers.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role,
            image: m.image,
            hasAccess: teamMemberIds.has(m.id),
         })),
      [orgMembers, teamMemberIds],
   );

   // Filter members by search
   const filteredMembers = useMemo(() => {
      if (!searchFilter.trim()) return members;
      const query = searchFilter.toLowerCase();
      return members.filter(
         (m) =>
            m.name.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query),
      );
   }, [members, searchFilter]);

   const addMemberMutation = useMutation(
      orpc.team.addMember.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.team.getMembers.queryOptions({
                  input: { teamId },
               }).queryKey,
            });
            toast.success("Membro adicionado ao projeto");
         },
         onError: (error) => {
            toast.error(error.message);
         },
      }),
   );

   const removeMemberMutation = useMutation(
      orpc.team.removeMember.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.team.getMembers.queryOptions({
                  input: { teamId },
               }).queryKey,
            });
            toast.success("Membro removido do projeto");
         },
         onError: (error) => {
            toast.error(error.message);
         },
      }),
   );

   function handleToggleAccess(member: MemberRow) {
      if (member.hasAccess) {
         openAlertDialog({
            title: "Remover acesso",
            description: `Tem certeza que deseja remover o acesso de ${member.name} a este projeto?`,
            actionLabel: "Remover",
            cancelLabel: "Cancelar",
            variant: "destructive",
            onAction: async () => {
               await removeMemberMutation.mutateAsync({
                  teamId,
                  userId: member.id,
               });
            },
         });
      } else {
         addMemberMutation.mutate({
            teamId,
            userId: member.id,
         });
      }
   }

   const columns: ColumnDef<MemberRow>[] = useMemo(
      () => [
         {
            accessorKey: "name",
            header: "Membro",
            cell: ({ row }) => (
               <div className="flex items-center gap-2">
                  <Avatar className="size-7">
                     <AvatarImage
                        alt={row.original.name}
                        src={row.original.image || undefined}
                     />
                     <AvatarFallback className="text-xs">
                        {getInitials(row.original.name)}
                     </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                     <span className="font-medium">{row.original.name}</span>
                     <span className="text-xs text-muted-foreground">
                        {row.original.email}
                     </span>
                  </div>
               </div>
            ),
         },
         {
            accessorKey: "role",
            header: "Função na organização",
            cell: ({ row }) => (
               <Badge variant={getRoleBadgeVariant(row.original.role)}>
                  {ROLE_LABELS[row.original.role] ?? row.original.role}
               </Badge>
            ),
         },
         {
            accessorKey: "hasAccess",
            header: "Acesso ao projeto",
            cell: ({ row }) => {
               const member = row.original;
               return (
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">
                        {member.hasAccess ? "Tem acesso" : "Sem acesso"}
                     </span>
                     <Switch
                        checked={member.hasAccess}
                        disabled={
                           addMemberMutation.isPending ||
                           removeMemberMutation.isPending
                        }
                        onCheckedChange={() => handleToggleAccess(member)}
                     />
                  </div>
               );
            },
         },
      ],
      [addMemberMutation.isPending, removeMemberMutation.isPending],
   );

   const membersWithAccess = members.filter((m) => m.hasAccess);

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-semibold font-serif">
                  Controle de Acesso
               </h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Gerencie quem pode acessar este projeto.
               </p>
            </div>
            <div className="flex items-center gap-2">
               <Badge className="gap-1.5" variant="outline">
                  <ShieldCheck className="size-3" />
                  {membersWithAccess.length} membro
                  {membersWithAccess.length !== 1 ? "s" : ""} com acesso
               </Badge>
            </div>
         </div>

         <section className="space-y-3">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-lg font-medium">
                     Membros da organização
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     Controle quais membros da organização podem acessar este
                     projeto
                  </p>
               </div>
            </div>

            <div className="relative max-w-sm">
               <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
               <Input
                  className="pl-8 h-9"
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Pesquisar por nome ou e-mail..."
                  value={searchFilter}
               />
            </div>

            <DataTable
               columns={columns}
               data={filteredMembers}
               getRowId={(row) => row.id}
            />
         </section>
      </div>
   );
}

export function ProjectAccessControl({ teamId }: { teamId: string }) {
   return (
      <ErrorBoundary FallbackComponent={AccessControlErrorFallback}>
         <Suspense fallback={<AccessControlSkeleton />}>
            <AccessControlContent teamId={teamId} />
         </Suspense>
      </ErrorBoundary>
   );
}
