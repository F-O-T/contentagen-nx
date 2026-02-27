import { Button } from "@packages/ui/components/button";
import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import {
   createFileRoute,
   useNavigate,
   useParams,
} from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { ContextPanelAction } from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
import {
   type WriterRow,
   WritersTable,
   WritersTableSkeleton,
} from "@/features/writers/ui/writers-table";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/writers/",
)({
   component: WritersPage,
});

const WritersErrorFallback = createErrorFallback({
   errorTitle: "Não foi possível carregar escritores",
   errorDescription:
      "Ocorreu um erro ao buscar os perfis de escritor. Tente novamente.",
   retryText: "Tentar novamente",
});

function WritersPageSkeleton() {
   return (
      <main className="flex flex-col gap-4">
         <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
               <div className="h-9 w-48 bg-muted animate-pulse rounded" />
               <div className="h-5 w-80 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-9 w-36 bg-muted animate-pulse rounded" />
         </div>
         <WritersTableSkeleton />
      </main>
   );
}

function WritersContent() {
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   const { data: writers } = useSuspenseQuery(
      orpc.writer.list.queryOptions({}),
   );

   const createMutation = useMutation(
      orpc.writer.create.mutationOptions({
         onSuccess: (data) => {
            queryClient.invalidateQueries({
               queryKey: orpc.writer.list.queryOptions({}).queryKey,
            });
            navigate({
               to: "/$slug/$teamSlug/writers/$writerId",
               params: { slug, teamSlug, writerId: data.id },
            });
         },
         onError: () => {
            toast.error("Erro ao criar escritor");
         },
      }),
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

   useContextPanelInfo(
      <ContextPanel>
         <ContextPanelHeader>
            <ContextPanelTitle>Ações</ContextPanelTitle>
         </ContextPanelHeader>
         <ContextPanelContent>
            <ContextPanelAction
               icon={Plus}
               label="Novo escritor"
               onClick={() =>
                  createMutation.mutate({
                     personaConfig: {
                        metadata: { name: "Novo escritor" },
                        instructions: {
                           ragIntegration: true,
                           enableInternalLinking: true,
                           enableFactChecking: false,
                        },
                     },
                  })
               }
            />
         </ContextPanelContent>
      </ContextPanel>,
   );

   function handleEditWriter(writer: WriterRow) {
      navigate({
         to: "/$slug/$teamSlug/writers/$writerId",
         params: { slug, teamSlug, writerId: writer.id },
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
      <main className="flex flex-col gap-4">
         <div className="flex items-start justify-between">
            <div>
               <h1 className="text-2xl font-semibold font-serif">Escritores</h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Gerencie os perfis de escritor que guiam a geração de
                  conteúdo.
               </p>
            </div>
            <Button
               disabled={createMutation.isPending}
               onClick={() =>
                  createMutation.mutate({
                     personaConfig: {
                        metadata: { name: "Novo escritor" },
                        instructions: {
                           ragIntegration: true,
                           enableInternalLinking: true,
                           enableFactChecking: false,
                        },
                     },
                  })
               }
               size="sm"
            >
               {createMutation.isPending ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               ) : (
                  <Plus className="size-4 mr-2" />
               )}
               Novo escritor
            </Button>
         </div>
         <WritersTable
            onDelete={handleDeleteWriter}
            onEdit={handleEditWriter}
            writers={writers}
         />
      </main>
   );
}

function WritersPage() {
   return (
      <ErrorBoundary FallbackComponent={WritersErrorFallback}>
         <Suspense fallback={<WritersPageSkeleton />}>
            <WritersContent />
         </Suspense>
      </ErrorBoundary>
   );
}
