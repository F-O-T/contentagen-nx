import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import {
   DataTable,
   type MobileCardRenderProps,
} from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Separator } from "@packages/ui/components/separator";
import {
   SheetDescription,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Spinner } from "@packages/ui/components/spinner";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { getInitials } from "@packages/utils/text";
import {
   useMutation,
   useQuery,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
   ChevronDown,
   FolderKanban,
   Mail,
   Search,
   ShieldCheck,
   UserMinus,
   UserPlus,
} from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/organization/members",
)({
   component: MembersPage,
});

// ============================================
// Types
// ============================================

type MemberRow = {
   id: string;
   userId: string;
   name: string;
   email: string;
   role: string;
   image: string | null;
   createdAt: Date;
};

type PendingInvite = {
   id: string;
   email: string;
   role: string;
   createdAt: Date;
};

// ============================================
// Helpers
// ============================================

const ROLE_LABELS: Record<string, string> = {
   owner: "Proprietário",
   admin: "Administrador",
   member: "Membro",
};

function formatDate(date: Date | string): string {
   return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
   });
}

function getRoleBadgeVariant(
   role: string,
): "default" | "secondary" | "outline" {
   if (role === "owner") return "default";
   if (role === "admin") return "secondary";
   return "outline";
}

// ============================================
// Skeleton
// ============================================

function MembersSkeleton() {
   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <Skeleton className="h-8 w-32" />
               <Skeleton className="h-4 w-64 mt-1" />
            </div>
            <Skeleton className="h-8 w-24" />
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

// ============================================
// Error Fallback
// ============================================

function MembersErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Membros</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie os membros da sua organização.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar os membros da organização
            </p>
            <Button onClick={resetErrorBoundary} variant="outline">
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

// ============================================
// Invite Member Sheet Content
// ============================================

function InviteMemberSheetContent({
   organizationId,
   onSuccess,
}: {
   organizationId: string;
   onSuccess: () => void;
}) {
   const [email, setEmail] = useState("");
   const [role, setRole] = useState<"member" | "admin">("member");
   const queryClient = useQueryClient();

   const inviteMutation = useMutation({
      mutationFn: async () => {
         const result = await authClient.organization.inviteMember({
            email,
            role,
            organizationId,
         });
         if (result.error) {
            throw new Error(result.error.message ?? "Erro ao enviar convite");
         }
         return result.data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: ["pending-invites"],
         });
         toast.success("Convite enviado com sucesso");
         onSuccess();
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   const isValid = email.trim().length > 0 && email.includes("@");

   return (
      <div className="flex h-full flex-col">
         <SheetHeader>
            <SheetTitle>Convidar novo membro</SheetTitle>
            <SheetDescription>
               Adicione um novo membro à organização enviando um convite por
               e-mail.
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 space-y-6 py-6 px-1">
            <div className="space-y-2">
               <Label htmlFor="invite-email">Endereço de e-mail</Label>
               <Input
                  autoComplete="email"
                  id="invite-email"
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                     if (
                        e.key === "Enter" &&
                        isValid &&
                        !inviteMutation.isPending
                     ) {
                        inviteMutation.mutate();
                     }
                  }}
                  placeholder="usuario@empresa.com"
                  type="email"
                  value={email}
               />
               <p className="text-xs text-muted-foreground">
                  O convite será enviado para este endereço de e-mail
               </p>
            </div>

            <Separator />

            <div className="space-y-3">
               <div>
                  <Label htmlFor="invite-role">Função na organização</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                     Define as permissões do membro na organização
                  </p>
               </div>
               <Select
                  onValueChange={(v) => setRole(v as "member" | "admin")}
                  value={role}
               >
                  <SelectTrigger id="invite-role">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="member">
                        <div className="flex flex-col items-start">
                           <span className="font-medium">Membro</span>
                           <span className="text-xs text-muted-foreground">
                              Pode acessar e colaborar nos projetos
                           </span>
                        </div>
                     </SelectItem>
                     <SelectItem value="admin">
                        <div className="flex flex-col items-start">
                           <span className="font-medium">Administrador</span>
                           <span className="text-xs text-muted-foreground">
                              Pode gerenciar membros e configurações
                           </span>
                        </div>
                     </SelectItem>
                  </SelectContent>
               </Select>
            </div>

            <Card className="bg-muted/50">
               <CardContent className="pt-4 pb-4">
                  <div className="flex gap-3">
                     <div className="mt-0.5">
                        <Mail className="size-4 text-muted-foreground" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium">
                           Como funciona o convite
                        </p>
                        <p className="text-xs text-muted-foreground">
                           Um e-mail será enviado com um link de convite. O
                           destinatário poderá criar uma conta ou fazer login
                           para aceitar o convite.
                        </p>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>

         <div className="border-t pt-4 pb-2 px-4 flex gap-2">
            <Button
               className="flex-1"
               disabled={!isValid || inviteMutation.isPending}
               onClick={() => inviteMutation.mutate()}
            >
               {inviteMutation.isPending ? (
                  <Spinner className="size-4 mr-2" />
               ) : (
                  <Mail className="size-4 mr-2" />
               )}
               Enviar convite
            </Button>
         </div>
      </div>
   );
}

// ============================================
// Member Expandable Row
// ============================================

function MemberExpandedRow({
   member,
   onRemove,
}: {
   member: MemberRow;
   onRemove: (member: MemberRow) => void;
}) {
   const { data: teams } = useSuspenseQuery(
      orpc.organization.getOrganizationTeams.queryOptions({}),
   );

   const { data: memberTeams, isLoading } = useQuery(
      orpc.organization.getMemberTeams.queryOptions({
         input: { userId: member.userId },
      }),
   );

   return (
      <div className="px-4 py-4 space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
               <h4 className="text-sm font-medium text-muted-foreground">
                  Informações do membro
               </h4>
               <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">Entrou em:</span>
                     <span>{formatDate(member.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">Função:</span>
                     <Badge variant={getRoleBadgeVariant(member.role)}>
                        {ROLE_LABELS[member.role] ?? member.role}
                     </Badge>
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">
                     Acesso a projetos
                  </h4>
                  {!isLoading && memberTeams && (
                     <span className="text-xs text-muted-foreground">
                        {memberTeams.length} de {teams.length}
                     </span>
                  )}
               </div>
               {isLoading ? (
                  <Skeleton className="h-6 w-32" />
               ) : memberTeams && memberTeams.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                     {memberTeams.map((team) => (
                        <Badge key={team.id} variant="outline">
                           <FolderKanban className="size-3 mr-1" />
                           {team.name}
                        </Badge>
                     ))}
                  </div>
               ) : (
                  <p className="text-sm text-muted-foreground">
                     Sem acesso a projetos
                  </p>
               )}
            </div>
         </div>
         <div className="flex items-center gap-2 flex-wrap border-t pt-4">
            <Button
               className="text-destructive hover:text-destructive"
               onClick={() => onRemove(member)}
               size="sm"
               variant="ghost"
            >
               <UserMinus className="size-3 mr-2" />
               Remover membro
            </Button>
         </div>
      </div>
   );
}

// ============================================
// Mobile Card Renderer
// ============================================

function MemberMobileCard({
   row,
   isExpanded,
   toggleExpanded,
   canExpand,
   onUpdateRole,
}: MobileCardRenderProps<MemberRow> & {
   onUpdateRole?: (member: MemberRow, newRole: string) => void;
}) {
   const { data: sessionData } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );
   const currentUserId = sessionData?.user?.id;
   const member = row.original;
   const isSelf = member.userId === currentUserId;
   const isOwner = member.role === "owner";
   const isDisabled = isSelf || isOwner;
   const roleLabel =
      member.role === "admin"
         ? "Alterar para membro"
         : "Alterar para administrador";

   return (
      <Card>
         <CardContent className="p-4">
            <div className="flex items-start gap-3">
               <Avatar className="size-10">
                  <AvatarImage
                     alt={member.name}
                     src={member.image || undefined}
                  />
                  <AvatarFallback className="text-sm">
                     {getInitials(member.name)}
                  </AvatarFallback>
               </Avatar>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                     <p className="font-medium truncate">{member.name}</p>
                     {isSelf && (
                        <Badge className="text-[10px] px-1.5" variant="outline">
                           você
                        </Badge>
                     )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                     {member.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                     <Badge variant={getRoleBadgeVariant(member.role)}>
                        {ROLE_LABELS[member.role] ?? member.role}
                     </Badge>
                     <span className="text-xs text-muted-foreground">
                        Desde {formatDate(member.createdAt)}
                     </span>
                  </div>
               </div>
               <div className="flex items-center gap-1">
                  {onUpdateRole && (
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              disabled={isDisabled}
                              onClick={() =>
                                 onUpdateRole(
                                    member,
                                    member.role === "admin"
                                       ? "member"
                                       : "admin",
                                 )
                              }
                              size="icon"
                              variant="ghost"
                           >
                              <ShieldCheck className="size-4" />
                              <span className="sr-only">{roleLabel}</span>
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>{roleLabel}</TooltipContent>
                     </Tooltip>
                  )}
                  {canExpand && (
                     <Button
                        onClick={toggleExpanded}
                        size="icon"
                        variant="ghost"
                     >
                        <ChevronDown
                           className={`size-4 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                           }`}
                        />
                     </Button>
                  )}
               </div>
            </div>
         </CardContent>
      </Card>
   );
}

// ============================================
// Pending Invites Section
// ============================================

function PendingInvitesSection({ organizationId }: { organizationId: string }) {
   const queryClient = useQueryClient();

   const { data: invitesData, isLoading } = useQuery({
      queryKey: ["pending-invites", organizationId],
      queryFn: async () => {
         const result = await authClient.organization.listInvitations({
            query: { organizationId },
         });
         if (result.error) {
            throw new Error(
               result.error.message ?? "Erro ao carregar convites",
            );
         }
         return result.data as PendingInvite[] | null;
      },
   });

   const cancelMutation = useMutation({
      mutationFn: async (invitationId: string) => {
         const result = await authClient.organization.cancelInvitation({
            invitationId,
         });
         if (result.error) {
            throw new Error(result.error.message ?? "Erro ao cancelar convite");
         }
         return result.data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: ["pending-invites"],
         });
         toast.success("Convite cancelado");
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   const invites = invitesData ?? [];

   if (isLoading) {
      return (
         <section className="space-y-3">
            <div>
               <h2 className="text-lg font-medium">Convites pendentes</h2>
               <p className="text-sm text-muted-foreground mt-1">
                  Convites enviados que ainda não foram aceitos.
               </p>
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
         </section>
      );
   }

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Convites pendentes</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Convites enviados que ainda não foram aceitos.
            </p>
         </div>

         {invites.length === 0 ? (
            <Empty>
               <EmptyMedia>
                  <Mail className="size-8 text-muted-foreground" />
               </EmptyMedia>
               <EmptyHeader>
                  <EmptyTitle>Nenhum convite pendente</EmptyTitle>
                  <EmptyDescription>
                     Quando você convidar novos membros, os convites pendentes
                     aparecerão aqui.
                  </EmptyDescription>
               </EmptyHeader>
            </Empty>
         ) : (
            <div className="rounded-md border">
               <div className="divide-y">
                  {invites.map((invite) => (
                     <div
                        className="flex items-center justify-between px-4 py-3"
                        key={invite.id}
                     >
                        <div className="flex items-center gap-3 min-w-0">
                           <Mail className="size-4 text-muted-foreground shrink-0" />
                           <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                 {invite.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                 {ROLE_LABELS[invite.role] ?? invite.role}{" "}
                                 &middot; Enviado em{" "}
                                 {formatDate(invite.createdAt)}
                              </p>
                           </div>
                        </div>
                        <Button
                           disabled={cancelMutation.isPending}
                           onClick={() => cancelMutation.mutate(invite.id)}
                           size="sm"
                           variant="ghost"
                        >
                           Cancelar
                        </Button>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </section>
   );
}

// ============================================
// Main Content Component
// ============================================

function MembersContent() {
   const queryClient = useQueryClient();
   const { openSheet, closeSheet } = useSheet();
   const { openAlertDialog } = useAlertDialog();
   const [searchFilter, setSearchFilter] = useState("");

   const { data: members } = useSuspenseQuery(
      orpc.organization.getMembers.queryOptions({}),
   );

   const { data: activeOrg } = useSuspenseQuery(
      orpc.organization.getActiveOrganization.queryOptions({}),
   );

   const { data: sessionData } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   const currentUserId = sessionData?.user?.id;
   const organizationId = activeOrg?.id ?? "";

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

   // Mutations
   const removeMutation = useMutation({
      mutationFn: async (memberIdOrEmail: string) => {
         const result = await authClient.organization.removeMember({
            memberIdOrEmail,
            organizationId,
         });
         if (result.error) {
            throw new Error(result.error.message ?? "Erro ao remover membro");
         }
         return result.data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: orpc.organization.getMembers.queryOptions({}).queryKey,
         });
         toast.success("Membro removido com sucesso");
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   const updateRoleMutation = useMutation({
      mutationFn: async ({
         memberId,
         role,
      }: {
         memberId: string;
         role: string;
      }) => {
         const result = await authClient.organization.updateMemberRole({
            memberId,
            role,
            organizationId,
         });
         if (result.error) {
            throw new Error(result.error.message ?? "Erro ao alterar função");
         }
         return result.data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: orpc.organization.getMembers.queryOptions({}).queryKey,
         });
         toast.success("Função atualizada com sucesso");
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   function handleRemoveMember(member: MemberRow) {
      openAlertDialog({
         title: "Remover membro",
         description: `Tem certeza que deseja remover ${member.name} da organização? Esta ação não pode ser desfeita.`,
         actionLabel: "Remover",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await removeMutation.mutateAsync(member.id);
         },
      });
   }

   function handleUpdateRole(member: MemberRow, newRole: string) {
      updateRoleMutation.mutate({
         memberId: member.id,
         role: newRole,
      });
   }

   function handleOpenInviteSheet() {
      openSheet({
         children: (
            <InviteMemberSheetContent
               onSuccess={closeSheet}
               organizationId={organizationId}
            />
         ),
      });
   }

   // Column definitions
   const columns: ColumnDef<MemberRow>[] = useMemo(
      () => [
         {
            accessorKey: "name",
            header: "Nome",
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
                  <span className="truncate font-medium">
                     {row.original.name}
                  </span>
                  {row.original.id === currentUserId && (
                     <Badge className="text-[10px] px-1.5" variant="outline">
                        você
                     </Badge>
                  )}
               </div>
            ),
         },
         {
            accessorKey: "email",
            header: "E-mail",
            cell: ({ row }) => (
               <span className="text-muted-foreground">
                  {row.original.email}
               </span>
            ),
         },
         {
            accessorKey: "role",
            header: "Função",
            cell: ({ row }) => (
               <Badge variant={getRoleBadgeVariant(row.original.role)}>
                  {ROLE_LABELS[row.original.role] ?? row.original.role}
               </Badge>
            ),
         },
         {
            accessorKey: "createdAt",
            header: "Desde",
            cell: ({ row }) => (
               <span className="text-muted-foreground text-sm">
                  {formatDate(row.original.createdAt)}
               </span>
            ),
         },
         {
            id: "actions",
            header: "",
            cell: ({ row }) => {
               const member = row.original;
               const isSelf = member.userId === currentUserId;
               const isOwner = member.role === "owner";
               const isDisabled = isSelf || isOwner;
               const roleLabel =
                  member.role === "admin"
                     ? "Alterar para membro"
                     : "Alterar para administrador";

               return (
                  // biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation wrapper for table row click
                  <div
                     className="flex items-center justify-end gap-1"
                     onClick={(e) => e.stopPropagation()}
                     onKeyDown={(e) => e.stopPropagation()}
                  >
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              disabled={isDisabled}
                              onClick={() =>
                                 handleUpdateRole(
                                    member,
                                    member.role === "admin"
                                       ? "member"
                                       : "admin",
                                 )
                              }
                              size="icon"
                              variant="ghost"
                           >
                              <ShieldCheck className="size-4" />
                              <span className="sr-only">{roleLabel}</span>
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>{roleLabel}</TooltipContent>
                     </Tooltip>
                  </div>
               );
            },
         },
      ],
      [currentUserId],
   );

   return (
      <div className="space-y-6">
         {/* Header */}
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-semibold font-serif">Membros</h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Gerencie os membros da sua organização.
               </p>
            </div>
            <Button onClick={handleOpenInviteSheet} size="sm">
               <UserPlus className="size-4 mr-2" />
               Convidar membro
            </Button>
         </div>

         {/* Pending invites */}
         <PendingInvitesSection organizationId={organizationId} />

         {/* Members data table */}
         <section className="space-y-3">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-lg font-medium">
                     Membros da organização
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     {members.length}{" "}
                     {members.length === 1 ? "membro" : "membros"} na
                     organização
                  </p>
               </div>
            </div>

            {/* Search */}
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
               renderMobileCard={(props) => (
                  <MemberMobileCard
                     {...props}
                     onUpdateRole={handleUpdateRole}
                  />
               )}
               renderSubComponent={({ row }) => (
                  <MemberExpandedRow
                     member={row.original}
                     onRemove={handleRemoveMember}
                  />
               )}
            />
         </section>
      </div>
   );
}

// ============================================
// Page Component
// ============================================

function MembersPage() {
   return (
      <ErrorBoundary FallbackComponent={MembersErrorFallback}>
         <Suspense fallback={<MembersSkeleton />}>
            <MembersContent />
         </Suspense>
      </ErrorBoundary>
   );
}
