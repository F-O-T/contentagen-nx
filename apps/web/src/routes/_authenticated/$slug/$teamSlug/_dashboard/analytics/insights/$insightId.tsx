import type { InsightConfig } from "@packages/analytics/types";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
   type InsightType,
   useInsightConfig,
} from "@/features/analytics/hooks/use-insight-config";
import { InsightBuilder } from "@/features/analytics/ui/insight-builder";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/$insightId",
)({
   component: EditInsightPage,
});

function EditInsightPage() {
   const { insightId } = Route.useParams();
   const queryClient = useQueryClient();

   const {
      data: insight,
      isLoading,
      error,
   } = useQuery(
      orpc.insights.getById.queryOptions({
         input: { id: insightId },
      }),
   );

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
         // After setType resets config to defaults, we need to override with the real config
         // Use a microtask to ensure setType's state update is processed first
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

   const handleSave = useCallback(() => {
      if (!insightName.trim()) {
         toast.error("O nome do insight é obrigatório");
         return;
      }
      updateMutation.mutate({
         id: insightId,
         name: insightName.trim(),
         description: insightDescription.trim() || undefined,
         config: config as Record<string, unknown>,
      });
   }, [insightId, insightName, insightDescription, config, updateMutation]);

   if (isLoading) {
      return (
         <main className="flex flex-col gap-4 h-full">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-8 w-full max-w-md" />
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 flex-1">
               <Skeleton className="h-[400px]" />
               <Skeleton className="h-[400px]" />
            </div>
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
         disableTypeSwitch
         heading="Editar Insight"
         isSaving={updateMutation.isPending}
         name={insightName}
         onConfigUpdate={updateConfigImmediate}
         onDescriptionChange={setInsightDescription}
         onNameChange={setInsightName}
         onSave={handleSave}
         onTypeChange={setType}
         type={type}
      />
   );
}
