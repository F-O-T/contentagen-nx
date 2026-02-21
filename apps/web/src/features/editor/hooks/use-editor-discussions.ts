import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useEditorDiscussions(contentId: string | undefined) {
  const { data } = useSuspenseQuery(
    contentId
      ? orpc.discussions.getByContent.queryOptions({
          input: { contentId },
          staleTime: 30_000,
        })
      : { queryKey: ["discussions-empty"], queryFn: () => ({ discussions: [], users: {} }) },
  );

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
