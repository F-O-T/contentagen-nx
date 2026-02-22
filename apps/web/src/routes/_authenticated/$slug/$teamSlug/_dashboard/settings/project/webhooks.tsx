import { Button } from "@packages/ui/components/button";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { TooltipProvider } from "@packages/ui/components/tooltip";
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
import { WebhookForm } from "@/features/webhooks/ui/webhook-form";
import { WebhookSecretDialog } from "@/features/webhooks/ui/webhook-secret-dialog";
import {
   type WebhookEndpoint,
   WebhooksTable,
} from "@/features/webhooks/ui/webhooks-table";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/webhooks",
)({
   component: ProjectWebhooksPage,
});

const WebhooksErrorFallback = createErrorFallback({
   errorTitle: "Não foi possível carregar webhooks",
   errorDescription: "Ocorreu um erro ao buscar os endpoints. Tente novamente.",
   retryText: "Tentar novamente",
});

function WebhooksSkeleton() {
   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <Skeleton className="h-7 w-40" />
               <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-9 w-36" />
         </div>
         <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
               <Skeleton
                  className="h-12 w-full"
                  key={`webhooks-skeleton-${index + 1}`}
               />
            ))}
         </div>
      </div>
   );
}

function WebhooksContent() {
   const queryClient = useQueryClient();
   const { openSheet, closeSheet } = useSheet();
   const { openCredenza, closeCredenza } = useCredenza();
   const { openAlertDialog } = useAlertDialog();

   const { data: webhooks } = useSuspenseQuery(
      orpc.webhooks.list.queryOptions({}),
   );
   const { data: eventCatalog } = useSuspenseQuery(
      orpc.eventCatalog.list.queryOptions({}),
   );

   const deleteMutation = useMutation(
      orpc.webhooks.remove.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.webhooks.list.queryOptions({}).queryKey,
            });
            toast.success("Webhook excluído com sucesso");
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao excluir webhook");
         },
      }),
   );

   function handleCreateWebhook() {
      openSheet({
         children: (
            <WebhookForm
               eventCatalog={eventCatalog}
               mode="create"
               onSuccess={(result) => {
                  closeSheet();
                  if (result?.plaintextSecret && result.url) {
                     openCredenza({
                        children: (
                           <WebhookSecretDialog
                              onClose={closeCredenza}
                              plaintextSecret={result.plaintextSecret}
                              url={result.url}
                           />
                        ),
                     });
                  }
               }}
            />
         ),
      });
   }

   function handleEditWebhook(webhook: WebhookEndpoint) {
      openSheet({
         children: (
            <WebhookForm
               eventCatalog={eventCatalog}
               mode="edit"
               onSuccess={() => closeSheet()}
               webhook={webhook}
            />
         ),
      });
   }

   function handleDeleteWebhook(webhook: WebhookEndpoint) {
      openAlertDialog({
         title: "Excluir webhook",
         description: `Tem certeza que deseja excluir o endpoint ${webhook.url}? Esta ação não pode ser desfeita.`,
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await deleteMutation.mutateAsync({ id: webhook.id });
         },
      });
   }

   return (
      <TooltipProvider>
         <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="text-2xl font-semibold font-serif">
                     Webhooks
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                     Configure endpoints para receber eventos do projeto.
                  </p>
               </div>
               <Button onClick={handleCreateWebhook} size="sm">
                  <Plus className="size-4 mr-2" />
                  Criar endpoint
               </Button>
            </div>

            <WebhooksTable
               onDelete={handleDeleteWebhook}
               onEdit={handleEditWebhook}
               webhooks={webhooks}
            />
         </div>
      </TooltipProvider>
   );
}

function ProjectWebhooksPage() {
   return (
      <ErrorBoundary FallbackComponent={WebhooksErrorFallback}>
         <Suspense fallback={<WebhooksSkeleton />}>
            <WebhooksContent />
         </Suspense>
      </ErrorBoundary>
   );
}
