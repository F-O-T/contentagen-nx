import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

/**
 * Mutation hook to mark an onboarding task as completed (or skipped).
 * Optimistically updates the local query cache so the UI feels instant.
 */
export function useCompleteTask() {
   const queryClient = useQueryClient();

   return useMutation(
      orpc.onboarding.completeTask.mutationOptions({
         onMutate: async (variables) => {
            // Cancel outgoing refetches
            const queryKey = orpc.onboarding.getOnboardingStatus.queryOptions(
               {},
            ).queryKey;
            await queryClient.cancelQueries({ queryKey });

            // Snapshot previous value
            const previous = queryClient.getQueryData(queryKey);

            // Optimistically update the tasks map
            // biome-ignore lint/suspicious/noExplicitAny: onboarding tasks type is opaque from Better Auth
            queryClient.setQueryData(queryKey, (old: any) => {
               if (!old) return old;
               return {
                  ...old,
                  project: {
                     ...old.project,
                     tasks: {
                        ...(old.project.tasks ?? {}),
                        [variables.taskId]: true,
                     },
                  },
               };
            });

            return { previous };
         },
         onError: (_err, _variables, context) => {
            // Roll back on error
            if (context?.previous) {
               const queryKey =
                  orpc.onboarding.getOnboardingStatus.queryOptions({}).queryKey;
               queryClient.setQueryData(queryKey, context.previous);
            }
         },
         onSettled: () => {
            // Refetch to ensure consistency
            const queryKey = orpc.onboarding.getOnboardingStatus.queryOptions(
               {},
            ).queryKey;
            queryClient.invalidateQueries({ queryKey });
         },
      }),
   );
}
