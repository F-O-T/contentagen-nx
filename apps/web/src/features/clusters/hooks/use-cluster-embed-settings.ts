import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";

export function useClusterEmbedSettings() {
   return useMutation(
      orpc.clusters.updateConfig.mutationOptions({
         onSuccess: () => {
            toast.success("Configurações de embed salvas!");
         },
         onError: () => {
            toast.error("Erro ao salvar configurações de embed");
         },
      }),
   );
}
