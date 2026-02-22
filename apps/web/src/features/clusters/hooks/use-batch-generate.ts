import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

export function useBatchGenerate() {
   return useMutation(
      orpc.clusters.create.mutationOptions({
         onSuccess: () => {
            toast.success("Cluster criado com sucesso!");
         },
         onError: () => {
            toast.error("Erro ao criar cluster");
         },
      }),
   );
}
