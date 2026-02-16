import { Button } from "@packages/ui/components/button";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@packages/ui/components/dialog";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { Spinner } from "@packages/ui/components/spinner";
import { Textarea } from "@packages/ui/components/textarea";
import { PERMISSION_GROUPS } from "@packages/utils/permissions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

type RoleFormDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   role?: {
      id: string;
      name: string;
      description: string | null;
      permissions: string[];
   };
};

export function RoleFormDialog({
   open,
   onOpenChange,
   role,
}: RoleFormDialogProps) {
   const isEdit = !!role;
   const queryClient = useQueryClient();

   const [name, setName] = useState(role?.name ?? "");
   const [description, setDescription] = useState(role?.description ?? "");
   const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
      new Set(role?.permissions ?? []),
   );

   const createMutation = useMutation(
      orpc.roles.create.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.roles.getAll.queryOptions({}).queryKey,
            });
            toast.success("Função criada com sucesso");
            onOpenChange(false);
         },
         onError: (error) => {
            toast.error(error.message);
         },
      }),
   );

   const updateMutation = useMutation(
      orpc.roles.update.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.roles.getAll.queryOptions({}).queryKey,
            });
            toast.success("Função atualizada com sucesso");
            onOpenChange(false);
         },
         onError: (error) => {
            toast.error(error.message);
         },
      }),
   );

   function handleTogglePermission(permissionId: string) {
      setSelectedPermissions((prev) => {
         const next = new Set(prev);
         if (next.has(permissionId)) {
            next.delete(permissionId);
         } else {
            next.add(permissionId);
         }
         return next;
      });
   }

   function handleSubmit() {
      if (isEdit && role) {
         updateMutation.mutate({
            roleId: role.id,
            name,
            description,
            permissions: Array.from(selectedPermissions),
         });
      } else {
         createMutation.mutate({
            name,
            description,
            permissions: Array.from(selectedPermissions),
         });
      }
   }

   const isPending = createMutation.isPending || updateMutation.isPending;
   const isValid = name.trim().length > 0 && selectedPermissions.size > 0;

   return (
      <Dialog onOpenChange={onOpenChange} open={open}>
         <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>
                  {isEdit ? "Editar função" : "Criar nova função"}
               </DialogTitle>
               <DialogDescription>
                  {isEdit
                     ? "Atualize as permissões e informações da função."
                     : "Crie uma função personalizada com permissões específicas."}
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
               <div className="space-y-2">
                  <Label htmlFor="role-name">Nome da função</Label>
                  <Input
                     id="role-name"
                     onChange={(e) => setName(e.target.value)}
                     placeholder="Ex: Editor de conteúdo"
                     value={name}
                  />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="role-description">Descrição (opcional)</Label>
                  <Textarea
                     id="role-description"
                     onChange={(e) => setDescription(e.target.value)}
                     placeholder="Descreva o propósito desta função..."
                     rows={2}
                     value={description}
                  />
               </div>

               <Separator />

               <div className="space-y-4">
                  <div>
                     <h4 className="text-sm font-medium">Permissões</h4>
                     <p className="text-xs text-muted-foreground mt-1">
                        Selecione as permissões que esta função terá
                     </p>
                  </div>

                  {PERMISSION_GROUPS.map((group) => (
                     <div className="space-y-3" key={group.id}>
                        <h5 className="text-sm font-medium">{group.label}</h5>
                        <div className="grid grid-cols-2 gap-3">
                           {group.permissions.map((permission) => (
                              <div
                                 className="flex items-center space-x-2"
                                 key={permission.id}
                              >
                                 <Checkbox
                                    checked={selectedPermissions.has(
                                       permission.id,
                                    )}
                                    id={permission.id}
                                    onCheckedChange={() =>
                                       handleTogglePermission(permission.id)
                                    }
                                 />
                                 <Label
                                    className="text-sm font-normal cursor-pointer"
                                    htmlFor={permission.id}
                                 >
                                    {permission.label}
                                 </Label>
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <DialogFooter>
               <Button
                  disabled={isPending}
                  onClick={() => onOpenChange(false)}
                  variant="outline"
               >
                  Cancelar
               </Button>
               <Button disabled={!isValid || isPending} onClick={handleSubmit}>
                  {isPending && <Spinner className="size-4 mr-2" />}
                  {isEdit ? "Atualizar" : "Criar função"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
