// apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/experiments/new.tsx
import { useMutation } from "@tanstack/react-query";
import {
   createFileRoute,
   useNavigate,
   useParams,
} from "@tanstack/react-router";
import { toast } from "sonner";
import { ExperimentBuilder } from "@/features/experiments/ui/experiment-builder";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/experiments/new",
)({
   component: NewExperimentPage,
});

function NewExperimentPage() {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   const createMutation = useMutation(
      orpc.experiments.create.mutationOptions({
         onSuccess: (data) => {
            toast.success("Experimento criado!");
            navigate({
               to: "/$slug/$teamSlug/experiments/$experimentId",
               params: { slug, teamSlug, experimentId: data.id },
            });
         },
         onError: (err) => {
            toast.error(err.message ?? "Erro ao criar experimento");
         },
      }),
   );

   return (
      <ExperimentBuilder
         isCreating={createMutation.isPending}
         onCreate={(config) =>
            createMutation.mutate({
               name: config.name,
               hypothesis: config.hypothesis,
               targetType: config.targetType as "content" | "form" | "cluster",
               goal: config.goal as
                  | "conversion"
                  | "ctr"
                  | "time_on_page"
                  | "form_submit",
            })
         }
      />
   );
}
