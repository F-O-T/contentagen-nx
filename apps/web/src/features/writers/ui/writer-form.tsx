import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   SheetDescription,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Spinner } from "@packages/ui/components/spinner";
import { Textarea } from "@packages/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import type { WriterRow } from "./writers-table";

interface WriterFormProps {
   mode: "create" | "edit";
   writer?: WriterRow;
   onSuccess: () => void;
}

export function WriterForm({ mode, writer, onSuccess }: WriterFormProps) {
   const queryClient = useQueryClient();

   const [name, setName] = useState(writer?.personaConfig.metadata.name ?? "");
   const [description, setDescription] = useState(
      writer?.personaConfig.metadata.description ?? "",
   );
   const [profilePhotoUrl, setProfilePhotoUrl] = useState(
      writer?.profilePhotoUrl ?? "",
   );

   const createMutation = useMutation(
      orpc.writer.create.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.writer.list.queryOptions({}).queryKey,
            });
            toast.success("Escritor criado com sucesso");
            onSuccess();
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao criar escritor");
         },
      }),
   );

   const updateMutation = useMutation(
      orpc.writer.update.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.writer.list.queryOptions({}).queryKey,
            });
            toast.success("Escritor atualizado com sucesso");
            onSuccess();
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao atualizar escritor");
         },
      }),
   );

   const isPending = createMutation.isPending || updateMutation.isPending;

   function handleSubmit(e: React.FormEvent) {
      e.preventDefault();

      if (!name.trim()) {
         toast.error("O nome do escritor é obrigatório");
         return;
      }

      const personaConfig = {
         metadata: {
            name: name.trim(),
            ...(description.trim() ? { description: description.trim() } : {}),
         },
      };

      if (mode === "create") {
         createMutation.mutate({
            personaConfig,
            ...(profilePhotoUrl.trim() ? { profilePhotoUrl: profilePhotoUrl.trim() } : {}),
         });
      } else if (writer) {
         updateMutation.mutate({
            id: writer.id,
            personaConfig,
            ...(profilePhotoUrl !== undefined
               ? { profilePhotoUrl: profilePhotoUrl || null }
               : {}),
         });
      }
   }

   return (
      <form className="flex flex-col h-full" onSubmit={handleSubmit}>
         <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>
               {mode === "create" ? "Novo escritor" : "Editar escritor"}
            </SheetTitle>
            <SheetDescription>
               {mode === "create"
                  ? "Configure um perfil de escritor para guiar a geração de conteúdo."
                  : "Atualize as configurações do perfil de escritor."}
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Identity */}
            <div className="space-y-4">
               <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Identidade
               </h3>

               <div className="space-y-2">
                  <Label htmlFor="writer-name">Nome *</Label>
                  <Input
                     id="writer-name"
                     onChange={(e) => setName(e.target.value)}
                     placeholder="Ex: Escritor técnico sênior"
                     required
                     value={name}
                  />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="writer-description">Descrição</Label>
                  <Textarea
                     id="writer-description"
                     onChange={(e) => setDescription(e.target.value)}
                     placeholder="Breve descrição do perfil e sua especialidade..."
                     rows={3}
                     value={description}
                  />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="writer-photo">URL da foto de perfil</Label>
                  <Input
                     id="writer-photo"
                     onChange={(e) => setProfilePhotoUrl(e.target.value)}
                     placeholder="https://..."
                     type="url"
                     value={profilePhotoUrl}
                  />
               </div>
            </div>
         </div>

         <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
            <Button disabled={isPending} type="submit">
               {isPending && <Spinner className="size-4 mr-2" />}
               {mode === "create" ? "Criar escritor" : "Salvar alterações"}
            </Button>
         </div>
      </form>
   );
}
