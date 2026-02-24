import { Button } from "@packages/ui/components/button";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { WriterForm } from "@/features/writers/ui/writer-form";
import {
   type WriterRow,
   WritersTable,
   WritersTableSkeleton,
} from "@/features/writers/ui/writers-table";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/writers",
)({
   component: ProjectWritersPage,
});

const WritersErrorFallback = createErrorFallback({
   errorTitle: "Não foi possível carregar escritores",
   errorDescription:
      "Ocorreu um erro ao buscar os perfis de escritor. Tente novamente.",
   retryText: "Tentar novamente",
});

function WritersSkeleton() {
   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <Skeleton className="h-7 w-36" />
               <Skeleton className="h-4 w-72 mt-2" />
            </div>
            <Skeleton className="h-9 w-36" />
         </div>
         <WritersTableSkeleton />
      </div>
   );
}

function WritersContent() {
   const queryClient = useQueryClient();
   const { openSheet, closeSheet } = useSheet();
   const { openAlertDialog } = useAlertDialog();

   const { data: writers } = useSuspenseQuery(
      orpc.writer.list.queryOptions({}),
   );

   const deleteMutation = useMutation(
      orpc.writer.remove.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.writer.list.queryOptions({}).queryKey,
            });
            toast.success("Escritor excluído com sucesso");
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao excluir escritor");
         },
      }),
   );

   function handleCreateWriter() {
      openSheet({
         children: <WriterForm mode="create" onSuccess={() => closeSheet()} />,
      });
   }

   function handleEditWriter(writer: WriterRow) {
      openSheet({
         children: (
            <WriterForm
               mode="edit"
               onSuccess={() => closeSheet()}
               writer={writer}
            />
         ),
      });
   }

   function handleDeleteWriter(writer: WriterRow) {
      openAlertDialog({
         title: "Excluir escritor",
         description: `Tem certeza que deseja excluir o escritor "${writer.personaConfig.metadata.name}"? Esta ação não pode ser desfeita.`,
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await deleteMutation.mutateAsync({ id: writer.id });
         },
      });
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-semibold font-serif">Escritores</h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Gerencie os perfis de escritor que guiam a geração de
                  conteúdo.
               </p>
            </div>
            <Button onClick={handleCreateWriter} size="sm">
               <Plus className="size-4 mr-2" />
               Novo escritor
            </Button>
         </div>

         <WritersTable
            onDelete={handleDeleteWriter}
            onEdit={handleEditWriter}
            writers={writers}
         />
      </div>
   );
}

function ProjectWritersPage() {
   return (
      <ErrorBoundary FallbackComponent={WritersErrorFallback}>
         <Suspense fallback={<WritersSkeleton />}>
            <WritersContent />
         </Suspense>
      </ErrorBoundary>
   );
}
