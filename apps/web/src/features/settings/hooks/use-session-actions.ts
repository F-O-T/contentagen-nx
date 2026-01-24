import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc, client } from "@/integrations/orpc/client";

export function useRevokeOtherSessions() {
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();

   const revokeOtherSessionsMutation = useMutation({
      mutationFn: () => client.session.revokeOtherSessions({}),
      onError: () => {
         toast.error("Falha ao encerrar outras sessões.");
      },
      onSuccess: () => {
         toast.success("Outras sessões foram encerradas com sucesso.");
         queryClient.invalidateQueries({
            queryKey: orpc.session.listSessions.queryKey({}),
         });
      },
   });

   const revokeOtherSessions = useCallback(() => {
      openAlertDialog({
         actionLabel: "Encerrar outras sessões",
         cancelLabel: "Cancelar",
         description: "Esta ação não pode ser desfeita.",
         onAction: async () => {
            await revokeOtherSessionsMutation.mutateAsync();
         },
         title: "Confirmar Exclusão",
         variant: "destructive",
      });
   }, [openAlertDialog, revokeOtherSessionsMutation]);

   return {
      isRevoking: revokeOtherSessionsMutation.isPending,
      revokeOtherSessions,
   };
}

export function useRevokeAllSessions() {
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();

   const revokeAllSessionsMutation = useMutation({
      mutationFn: () => client.session.revokeSessions({}),
      onError: () => {
         toast.error("Falha ao encerrar todas as sessões.");
      },
      onSuccess: () => {
         toast.success("Todas as sessões foram encerradas com sucesso.");
         queryClient.invalidateQueries({
            queryKey: orpc.session.listSessions.queryKey({}),
         });
      },
   });

   const revokeAllSessions = useCallback(() => {
      openAlertDialog({
         actionLabel: "Encerrar todas as sessões",
         cancelLabel: "Cancelar",
         description: "Esta ação não pode ser desfeita.",
         onAction: async () => {
            await revokeAllSessionsMutation.mutateAsync();
         },
         title: "Confirmar Exclusão",
         variant: "destructive",
      });
   }, [openAlertDialog, revokeAllSessionsMutation]);

   return {
      isRevoking: revokeAllSessionsMutation.isPending,
      revokeAllSessions,
   };
}
