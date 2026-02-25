import type { FolderWithChildren } from "@packages/database/repositories/folder-repository";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useFolders(teamId: string) {
   const queryClient = useQueryClient();

   const { data: folders } = useSuspenseQuery(
      orpc.folders.list.queryOptions({ input: { teamId } }),
   );

   const createMutation = useMutation(
      orpc.folders.create.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.folders.list.queryKey({ input: { teamId } }),
            });
         },
      }),
   );

   const updateMutation = useMutation(
      orpc.folders.update.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.folders.list.queryKey({ input: { teamId } }),
            });
         },
      }),
   );

   const removeMutation = useMutation(
      orpc.folders.remove.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.folders.list.queryKey({ input: { teamId } }),
            });
         },
      }),
   );

   const moveItemMutation = useMutation(
      orpc.folders.moveItem.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.folders.list.queryKey({ input: { teamId } }),
            });
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.list.queryKey({}),
            });
            queryClient.invalidateQueries({
               queryKey: orpc.insights.list.queryKey({}),
            });
         },
      }),
   );

   return {
      folders: folders as FolderWithChildren[],
      createMutation,
      updateMutation,
      removeMutation,
      moveItemMutation,
   };
}

export function useFoldersQuery(teamId: string) {
   return useQuery(orpc.folders.list.queryOptions({ input: { teamId } }));
}

function flattenFolders(
   nodes: FolderWithChildren[],
   out: { id: string; name: string; depth: number }[] = [],
   depth = 0,
): { id: string; name: string; depth: number }[] {
   for (const node of nodes) {
      out.push({ id: node.id, name: node.name, depth });
      flattenFolders(node.children, out, depth + 1);
   }
   return out;
}

export function getFolderPickerOptions(folders: FolderWithChildren[]) {
   return [
      { id: null as string | null, name: "Sem pasta", depth: 0 },
      ...flattenFolders(folders).map((f) => ({
         id: f.id as string | null,
         name: f.name,
         depth: f.depth,
      })),
   ];
}
