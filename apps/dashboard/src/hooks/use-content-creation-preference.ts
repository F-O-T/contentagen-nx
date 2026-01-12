import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { betterAuthClient, useTRPC } from "@/integrations/clients";

export type CreationMode = "plan" | "writer";

/**
 * Hook to manage the user's preferred content creation mode.
 * This preference is persisted server-side and synced across devices.
 *
 * - "plan": Start with AI planning mode (Pro only)
 * - "writer": Start with direct writing mode
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { preference, updatePreference, isPending } = useContentCreationPreference();
 *
 *   return (
 *     <button onClick={() => updatePreference('writer')}>
 *       Switch to Writer Mode
 *     </button>
 *   );
 * }
 * ```
 */
export function useContentCreationPreference() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   // Read from session (server-persisted)
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   const preference =
      (session?.user?.contentCreationMode as CreationMode) || "plan";

   // Update mutation
   const updateMutation = useMutation({
      mutationFn: async (mode: CreationMode) => {
         return betterAuthClient.updateUser({
            contentCreationMode: mode,
         });
      },
      onSuccess: () => {
         // Invalidate session to reflect updated preference
         queryClient.invalidateQueries({
            queryKey: trpc.session.getSession.queryKey(),
         });
      },
   });

   const updatePreference = (mode: CreationMode) => {
      updateMutation.mutate(mode);
   };

   return {
      preference,
      updatePreference,
      isPending: updateMutation.isPending,
   };
}
