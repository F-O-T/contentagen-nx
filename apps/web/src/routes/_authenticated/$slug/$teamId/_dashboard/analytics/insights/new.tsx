import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
   createFileRoute,
   useNavigate,
   useParams,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useInsightConfig } from "@/features/analytics/hooks/use-insight-config";
import { InsightBuilder } from "@/features/analytics/ui/insight-builder";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/analytics/insights/new",
)({
   component: NewInsightPage,
});

function NewInsightPage() {
   const navigate = useNavigate();
   const { slug, teamId } = useParams({ strict: false }) as {
      slug: string;
      teamId: string;
   };
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
               to: "/$slug/$teamId/analytics/insights/$insightId",
               params: { slug, teamId, insightId: data.id },
            } as never);
         },
         onError: () => {
            toast.error("Erro ao criar insight");
         },
      }),
   );

   const handleSave = () => {
      if (!insightName.trim()) {
         toast.error("O nome do insight é obrigatório");
         return;
      }
      createMutation.mutate({
         name: insightName.trim(),
         description: insightDescription.trim() || undefined,
         type,
         config: config as Record<string, unknown>,
      });
   };

   return (
      <InsightBuilder
         config={config}
         description={insightDescription}
         heading="Novo Insight"
         isSaving={createMutation.isPending}
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
