import type { InsightConfig } from "@packages/analytics/types";
import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Clock, Copy, RefreshCw, Tag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
   type InsightType,
   useInsightConfig,
} from "@/features/analytics/hooks/use-insight-config";
import { InsightBuilder } from "@/features/analytics/ui/insight-builder";
import {
   ContextPanelAction,
   ContextPanelDivider,
   ContextPanelMeta,
} from "@/features/context-panel/context-panel-info";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/$insightId",
)({
   component: EditInsightPage,
});

function EditInsightPage() {
   useSidebarSection("insights");
   const { insightId, slug, teamSlug } = Route.useParams();
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();

   const {
      data: insight,
      isLoading,
      error,
   } = useQuery(
      orpc.insights.getById.queryOptions({
         input: { id: insightId },
      }),
   );

   // Query for analytics results (used by TrendsResultsTable)
   const { data: queryResult } = useQuery({
      ...orpc.analytics.query.queryOptions({
         input: { config: insight?.config as InsightConfig },
      }),
      enabled: !!insight?.config,
   });

   const { type, config, setType, updateConfigImmediate } = useInsightConfig();
   const [insightName, setInsightName] = useState("");
   const [insightDescription, setInsightDescription] = useState("");
   const [initialized, setInitialized] = useState(false);

   // Populate the builder with the loaded insight data
   useEffect(() => {
      if (insight && !initialized) {
         setInsightName(insight.name);
         setInsightDescription(insight.description ?? "");
         const insightConfig = insight.config as InsightConfig;
         setType(insightConfig.type as InsightType);
         queueMicrotask(() => {
            updateConfigImmediate(insightConfig);
         });
         setInitialized(true);
      }
   }, [insight, initialized, setType, updateConfigImmediate]);

   const updateMutation = useMutation(
      orpc.insights.update.mutationOptions({
         onSuccess: () => {
            toast.success("Insight atualizado com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.insights.getById.queryOptions({
                  input: { id: insightId },
               }).queryKey,
            });
            queryClient.invalidateQueries({
               queryKey: orpc.insights.list.queryKey({}),
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar insight");
         },
      }),
   );

   const deleteMutation = useMutation(
      orpc.insights.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Insight deletado");
            queryClient.invalidateQueries({
               queryKey: orpc.insights.list.queryKey({}),
            });
            navigate({
               to: "/$slug/$teamSlug/analytics/insights",
               params: { slug, teamSlug },
            });
         },
         onError: () => {
            toast.error("Erro ao deletar insight");
         },
      }),
   );

   const duplicateMutation = useMutation(
      orpc.insights.create.mutationOptions({
         onSuccess: (data) => {
            toast.success("Insight duplicado");
            queryClient.invalidateQueries({
               queryKey: orpc.insights.list.queryKey({}),
            });
            navigate({
               to: "/$slug/$teamSlug/analytics/insights/$insightId",
               params: { slug, teamSlug, insightId: data.id },
            });
         },
         onError: () => {
            toast.error("Erro ao duplicar insight");
         },
      }),
   );

   const handleSave = useCallback(() => {
      if (!insightName.trim()) {
         toast.error("O nome do insight é obrigatório");
         return;
      }
      updateMutation.mutate({
         id: insightId,
         name: insightName.trim(),
         description: insightDescription.trim() || undefined,
         config: config as InsightConfig,
      });
   }, [insightId, insightName, insightDescription, config, updateMutation]);

   const handleDelete = useCallback(() => {
      openAlertDialog({
         title: "Deletar insight",
         description:
            "Tem certeza que deseja deletar este insight? Esta ação não pode ser desfeita.",
         actionLabel: "Deletar",
         onAction: () => deleteMutation.mutate({ id: insightId }),
      });
   }, [insightId, deleteMutation, openAlertDialog]);

   const handleDuplicate = useCallback(() => {
      if (!insight) return;
      duplicateMutation.mutate({
         name: `${insight.name} (cópia)`,
         description: insight.description ?? undefined,
         type: insight.type as "trends" | "funnels" | "retention",
         config: insight.config as InsightConfig,
      });
   }, [insight, duplicateMutation]);

   const handleRefresh = useCallback(() => {
      queryClient.invalidateQueries({
         queryKey: orpc.analytics.query.queryKey({
            input: { config: insight?.config as InsightConfig },
         }),
      });
      queryClient.invalidateQueries({
         queryKey: orpc.insights.getById.queryOptions({
            input: { id: insightId },
         }).queryKey,
      });
   }, [queryClient, insight?.config, insightId]);

   const TYPE_LABELS: Record<string, string> = {
      trends: "Tendências",
      funnels: "Funis",
      retention: "Retenção",
   };

   useContextPanelInfo(
      insight ? (
         <ContextPanel>
            <ContextPanelHeader>
               <ContextPanelTitle>
                  {insightName || insight.name}
               </ContextPanelTitle>
            </ContextPanelHeader>
            <ContextPanelContent>
               <ContextPanelMeta
                  icon={Tag}
                  label="Tipo"
                  value={TYPE_LABELS[insight.type] ?? insight.type}
               />
               <ContextPanelMeta
                  icon={Clock}
                  label="Calculado"
                  value={
                     insight.lastComputedAt
                        ? new Date(insight.lastComputedAt).toLocaleDateString(
                             "pt-BR",
                             {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                             },
                          )
                        : "—"
                  }
               />
               <ContextPanelDivider />
               <ContextPanelAction
                  icon={Copy}
                  label="Duplicar insight"
                  onClick={handleDuplicate}
               />
               <ContextPanelAction
                  icon={RefreshCw}
                  label="Atualizar resultados"
                  onClick={handleRefresh}
               />
               <ContextPanelDivider />
               <ContextPanelAction
                  icon={Trash2}
                  label="Excluir insight"
                  onClick={handleDelete}
                  variant="destructive"
               />
            </ContextPanelContent>
         </ContextPanel>
      ) : null,
   );

   if (isLoading) {
      return (
         <main className="flex flex-col gap-4 h-full">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-8 w-full max-w-md" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[400px] w-full" />
         </main>
      );
   }

   if (error) {
      return (
         <main className="flex flex-col items-center justify-center gap-3 h-64 text-muted-foreground">
            <AlertCircle className="size-8 text-destructive/60" />
            <p className="text-sm text-center max-w-xs">
               Erro ao carregar insight: {error.message}
            </p>
         </main>
      );
   }

   if (!insight) return null;

   return (
      <InsightBuilder
         config={config}
         description={insightDescription}
         isSaving={updateMutation.isPending}
         lastComputedAt={insight.lastComputedAt}
         name={insightName}
         onConfigUpdate={updateConfigImmediate}
         onDelete={handleDelete}
         onDescriptionChange={setInsightDescription}
         onDuplicate={handleDuplicate}
         onNameChange={setInsightName}
         onRefresh={handleRefresh}
         onSave={handleSave}
         onTypeChange={setType}
         queryResult={queryResult}
         type={type}
      />
   );
}
