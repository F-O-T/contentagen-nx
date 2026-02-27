import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, FileText, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
   ContextPanelAction,
   ContextPanelDivider,
   ContextPanelMeta,
} from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
import { WriterBuilder } from "@/features/writers/ui/writer-builder";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/writers/$writerId",
)({
   component: EditWriterPage,
});

function EditWriterPage() {
   const { writerId, slug, teamSlug } = Route.useParams();
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();

   const {
      data: writer,
      isLoading,
      error,
   } = useQuery(orpc.writer.getById.queryOptions({ input: { id: writerId } }));

   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [initialized, setInitialized] = useState(false);

   useEffect(() => {
      if (writer && !initialized) {
         setName(writer.personaConfig.metadata.name);
         setDescription(writer.personaConfig.metadata.description ?? "");
         setInitialized(true);
      }
   }, [writer, initialized]);

   const updateMutation = useMutation(
      orpc.writer.update.mutationOptions({
         onSuccess: () => {
            toast.success("Escritor atualizado com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.writer.getById.queryOptions({
                  input: { id: writerId },
               }).queryKey,
            });
            queryClient.invalidateQueries({
               queryKey: orpc.writer.list.queryOptions({}).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar escritor");
         },
      }),
   );

   const deleteMutation = useMutation(
      orpc.writer.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Escritor excluído");
            queryClient.invalidateQueries({
               queryKey: orpc.writer.list.queryOptions({}).queryKey,
            });
            navigate({
               to: "/$slug/$teamSlug/writers",
               params: { slug, teamSlug },
            });
         },
         onError: () => {
            toast.error("Erro ao excluir escritor");
         },
      }),
   );

   const handleSave = useCallback(() => {
      if (!name.trim()) {
         toast.error("O nome do escritor é obrigatório");
         return;
      }

      updateMutation.mutate({
         id: writerId,
         personaConfig: {
            metadata: {
               name: name.trim(),
               ...(description.trim()
                  ? { description: description.trim() }
                  : {}),
            },
         },
      });
   }, [writerId, name, description, updateMutation]);

   const handleDelete = useCallback(() => {
      openAlertDialog({
         title: "Excluir escritor",
         description: `Tem certeza que deseja excluir o escritor "${name}"? Esta ação não pode ser desfeita.`,
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: () => deleteMutation.mutate({ id: writerId }),
      });
   }, [writerId, name, deleteMutation, openAlertDialog]);

   useContextPanelInfo(
      writer ? (
         <ContextPanel>
            <ContextPanelHeader>
               <ContextPanelTitle>
                  {writer.personaConfig.metadata.name}
               </ContextPanelTitle>
            </ContextPanelHeader>
            <ContextPanelContent>
               <ContextPanelMeta
                  icon={FileText}
                  label="Conteúdos"
                  value={writer.contentCount ?? 0}
               />
               <ContextPanelDivider />
               <ContextPanelAction
                  icon={Trash2}
                  label="Excluir escritor"
                  onClick={handleDelete}
                  variant="destructive"
               />
            </ContextPanelContent>
         </ContextPanel>
      ) : null,
   );

   if (isLoading) {
      return (
         <main className="flex flex-col gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-8 w-full max-w-md" />
            <div className="flex gap-6 mt-4">
               <Skeleton className="h-[300px] w-80" />
               <Skeleton className="h-[300px] flex-1" />
            </div>
         </main>
      );
   }

   if (error) {
      return (
         <main className="flex flex-col items-center justify-center gap-3 h-64 text-muted-foreground">
            <AlertCircle className="size-8 text-destructive/60" />
            <p className="text-sm text-center max-w-xs">
               Erro ao carregar escritor: {error.message}
            </p>
         </main>
      );
   }

   if (!writer) return null;

   const instructions = writer.instructionMemories ?? [];

   return (
      <WriterBuilder
         contentCount={writer.contentCount}
         description={description}
         instructions={instructions}
         isSaving={updateMutation.isPending}
         name={name}
         onDelete={handleDelete}
         onDescriptionChange={setDescription}
         onNameChange={setName}
         onSave={handleSave}
         profilePhotoUrl={writer.profilePhotoUrl ?? null}
         recentContent={writer.recentContent}
         writerId={writerId}
      />
   );
}
