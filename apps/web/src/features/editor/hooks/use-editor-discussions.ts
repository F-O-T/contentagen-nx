import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useEditorDiscussions(contentId: string | undefined) {
   const { data } = useQuery({
      ...orpc.discussions.getByContent.queryOptions({
         input: { contentId: contentId! },
         staleTime: 30_000,
      }),
      enabled: !!contentId,
   });

   const createMutation = useMutation(
      orpc.discussions.create.mutationOptions(),
   );

   const addReplyMutation = useMutation(
      orpc.discussions.addReply.mutationOptions(),
   );

   const resolveMutation = useMutation(
      orpc.discussions.resolve.mutationOptions(),
   );

   const removeMutation = useMutation(
      orpc.discussions.remove.mutationOptions(),
   );

   const updateReplyMutation = useMutation(
      orpc.discussions.updateReply.mutationOptions(),
   );

   const removeReplyMutation = useMutation(
      orpc.discussions.removeReply.mutationOptions(),
   );

   return {
      discussions: data?.discussions ?? [],
      users: data?.users ?? {},
      mutations: {
         create: createMutation,
         addReply: addReplyMutation,
         resolve: resolveMutation,
         remove: removeMutation,
         updateReply: updateReplyMutation,
         removeReply: removeReplyMutation,
      },
   };
}
