import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { DataTable } from "@packages/ui/components/data-table";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";
import { RoleFormDialog } from "./role-form-dialog";

type Role = {
   id: string;
   name: string;
   description: string | null;
   permissions: string[];
   isDefault: boolean;
   memberCount: number;
   createdAt: Date;
   updatedAt: Date;
};

function OrganizationRolesSkeleton() {
   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <Skeleton className="h-8 w-48" />
               <Skeleton className="h-4 w-96 mt-1" />
            </div>
            <Skeleton className="h-9 w-32" />
         </div>
         <Skeleton className="h-[400px] w-full" />
      </div>
   );
}

function OrganizationRolesErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Funções</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as funções e permissões da organização.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar as funções
            </p>
            <Button onClick={resetErrorBoundary} variant="outline">
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

function OrganizationRolesContent() {
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editingRole, setEditingRole] = useState<Role | undefined>();

   const { data: roles } = useSuspenseQuery(orpc.roles.getAll.queryOptions({}));

   const deleteMutation = useMutation(
      orpc.roles.deleteRole.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.roles.getAll.queryOptions({}).queryKey,
            });
            toast.success("Função removida com sucesso");
         },
         onError: (error) => {
            toast.error(error.message);
         },
      }),
   );

   function handleCreateRole() {
      setEditingRole(undefined);
      setDialogOpen(true);
   }

   function handleEditRole(role: Role) {
      setEditingRole(role);
      setDialogOpen(true);
   }

   function handleDeleteRole(role: Role) {
      openAlertDialog({
         title: "Remover função",
         description: `Tem certeza que deseja remover a função "${role.name}"? Esta ação não pode ser desfeita.`,
         actionLabel: "Remover",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await deleteMutation.mutateAsync({ roleId: role.id });
         },
      });
   }

   const columns: ColumnDef<Role>[] = useMemo(
      () => [
         {
            accessorKey: "name",
            header: "Função",
            cell: ({ row }) => (
               <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                     <span className="font-medium">{row.original.name}</span>
                     {row.original.isDefault && (
                        <Badge variant="secondary">Padrão</Badge>
                     )}
                  </div>
                  {row.original.description && (
                     <span className="text-xs text-muted-foreground mt-0.5">
                        {row.original.description}
                     </span>
                  )}
               </div>
            ),
         },
         {
            accessorKey: "memberCount",
            header: "Membros",
            cell: ({ row }) => (
               <Badge variant="outline">
                  {row.original.memberCount}{" "}
                  {row.original.memberCount === 1 ? "membro" : "membros"}
               </Badge>
            ),
         },
         {
            accessorKey: "permissions",
            header: "Permissões",
            cell: ({ row }) => (
               <span className="text-sm text-muted-foreground">
                  {row.original.permissions.length}{" "}
                  {row.original.permissions.length === 1
                     ? "permissão"
                     : "permissões"}
               </span>
            ),
         },
         {
            id: "actions",
            header: "",
            cell: ({ row }) => {
               const role = row.original;
               if (role.isDefault) return null;

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
                              onClick={() => handleEditRole(role)}
                              size="icon"
                              variant="ghost"
                           >
                              <Pencil className="size-4" />
                              <span className="sr-only">Editar função</span>
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar função</TooltipContent>
                     </Tooltip>
                  </div>
               );
            },
         },
      ],
      [],
   );

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-semibold font-serif">Funções</h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Gerencie as funções e permissões da organização.
               </p>
            </div>
            <Button onClick={handleCreateRole} size="sm">
               <Plus className="size-4 mr-2" />
               Criar função
            </Button>
         </div>

         <DataTable
            columns={columns}
            data={roles}
            getRowId={(row) => row.id}
            renderSubComponent={({ row }) => {
               const role = row.original;
               if (role.isDefault) return null;
               return (
                  <div className="px-4 py-4">
                     <div className="flex items-center gap-2 flex-wrap">
                        <Button
                           className="text-destructive hover:text-destructive"
                           onClick={() => handleDeleteRole(role)}
                           size="sm"
                           variant="ghost"
                        >
                           <Trash2 className="size-3 mr-2" />
                           Remover função
                        </Button>
                     </div>
                  </div>
               );
            }}
         />

         <RoleFormDialog
            onOpenChange={setDialogOpen}
            open={dialogOpen}
            role={editingRole}
         />
      </div>
   );
}

export function OrganizationRoles() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationRolesErrorFallback}>
         <Suspense fallback={<OrganizationRolesSkeleton />}>
            <OrganizationRolesContent />
         </Suspense>
      </ErrorBoundary>
   );
}
