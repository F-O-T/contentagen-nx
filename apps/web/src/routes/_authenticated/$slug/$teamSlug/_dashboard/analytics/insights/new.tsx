import type { InsightConfig } from "@packages/analytics/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
   createFileRoute,
   useNavigate,
   useParams,
} from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useInsightConfig } from "@/features/analytics/hooks/use-insight-config";
import { InsightBuilder } from "@/features/analytics/ui/insight-builder";
import { orpc } from "@/integrations/orpc/client";
import { useSidebarSection } from "@/layout/dashboard/hooks/use-sidebar-nav";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/insights/new",
)({
   component: NewInsightPage,
});

function NewInsightPage() {
   useSidebarSection("insights");
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const queryClient = useQueryClient();

   const { type, config, setType, updateConfigImmediate } = useInsightConfig();
   const [insightName, setInsightName] = useState("");
   const [insightDescription, setInsightDescription] = useState("");

   const createMutation = useMutation(
      orpc.insights.create.mutationOptions({
         onSuccess: (data) => {
            toast.success("Insight criado com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.insights.list.queryKey({}),
            });
            navigate({
               to: "/$slug/$teamSlug/analytics/insights/$insightId",
               params: { slug, teamSlug, insightId: data.id },
            });
         },
         onError: () => {
            toast.error("Erro ao criar insight");
         },
      }),
   );

   const handleSave = useCallback(() => {
      if (!insightName.trim()) {
         toast.error("O nome do insight é obrigatório");
         return;
      }
      createMutation.mutate({
         name: insightName.trim(),
         description: insightDescription.trim() || undefined,
         type,
         config: config as InsightConfig,
      });
   }, [insightName, insightDescription, type, config, createMutation]);

   const handleRefresh = useCallback(() => {
      // No-op for new insights (nothing to refresh yet)
   }, []);

   return (
      <InsightBuilder
         config={config}
         description={insightDescription}
         isSaving={createMutation.isPending}
         name={insightName}
         onConfigUpdate={updateConfigImmediate}
         onDescriptionChange={setInsightDescription}
         onNameChange={setInsightName}
         onRefresh={handleRefresh}
         onSave={handleSave}
         onTypeChange={setType}
         type={type}
      />
   );
}
