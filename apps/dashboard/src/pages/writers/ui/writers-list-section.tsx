import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import {
   WritersDataTable,
   WritersDataTableSkeleton,
} from "@/features/writers/ui/writers-data-table";
import { useTRPC } from "@/integrations/clients";

function WritersListContent() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [searchTerm, setSearchTerm] = useState("");

   const hasActiveFilters = searchTerm.length > 0;

   const clearFilters = () => {
      setSearchTerm("");
   };

   const { data } = useSuspenseQuery(
      trpc.agent.list.queryOptions({
         limit: 100,
         page: 1,
         search: searchTerm || undefined,
      }),
   );

   const deleteMutation = useMutation(
      trpc.agent.delete.mutationOptions({
         onSuccess: () => {
            toast.success("Escritor excluído com sucesso");
            queryClient.invalidateQueries({
               queryKey: trpc.agent.list.queryKey(),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.agent.getStats.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const handleDelete = (writerId: string) => {
      deleteMutation.mutate({ id: writerId });
   };

   const handleBulkDelete = (writerIds: string[]) => {
      for (const id of writerIds) {
         deleteMutation.mutate({ id });
      }
   };

   return (
      <WritersDataTable
         filters={{
            hasActiveFilters,
            onClearFilters: clearFilters,
            onSearchChange: setSearchTerm,
            searchTerm,
         }}
         onBulkDelete={handleBulkDelete}
         onDelete={handleDelete}
         writers={data.items}
      />
   );
}

function WritersListError({ error }: { error: Error }) {
   return (
      <div className="text-center py-8">
         <p className="text-muted-foreground">
            {"Ocorreu um erro. Por favor, tente novamente."}
         </p>
         <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
      </div>
   );
}

export function WritersListSection() {
   return (
      <ErrorBoundary FallbackComponent={WritersListError}>
         <Suspense fallback={<WritersDataTableSkeleton />}>
            <WritersListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
