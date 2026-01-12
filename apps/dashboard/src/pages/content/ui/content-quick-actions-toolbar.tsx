import { Button } from "@packages/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

export function ContentQuickActionsToolbar() {
   const navigate = useNavigate();
   const { activeOrganization } = useActiveOrganization();
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const createMutation = useMutation(
      trpc.content.create.mutationOptions({
         onSuccess: (data) => {
            queryClient.invalidateQueries({
               queryKey: trpc.content.listAllContent.queryKey(),
            });
            if (data?.id) {
               navigate({
                  to: "/$slug/content/$contentId",
                  params: {
                     slug: activeOrganization.slug,
                     contentId: data.id,
                  },
               });
            }
         },
         onError: (error) => {
            toast.error(error.message || "Erro ao criar conteúdo");
         },
      }),
   );

   return (
      <Button
         disabled={createMutation.isPending}
         onClick={() => createMutation.mutate({})}
      >
         {createMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
         ) : (
            <Plus className="size-4" />
         )}
         {"Novo Conteúdo"}
      </Button>
   );
}
