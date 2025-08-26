import { useState, useMemo, useCallback } from "react";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@packages/ui/components/button";
import { IdeaCard } from "./idea-card";
import type { RouterOutput } from "@packages/api/client";

export function IdeasListPage() {
   const trpc = useTRPC();
   const [page, setPage] = useState(1);
   const [limit] = useState(8);
   const { data } = useSuspenseQuery(
      trpc.ideas.listAllIdeas.queryOptions({ page, limit }),
   );

   const totalPages = useMemo(() => {
      return Math.ceil(data.total / limit);
   }, [data.total, limit]);

   const handlePrevPage = useCallback(() => {
      setPage((p) => Math.max(1, p - 1));
   }, []);

   const handleNextPage = useCallback(() => {
      setPage((p) => Math.min(totalPages, p + 1));
   }, [totalPages]);

   return (
      <main className="h-full w-full flex flex-col gap-4">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.items.map(
               (
                  item: RouterOutput["ideas"]["listAllIdeas"]["items"][number],
               ) => (
                  <IdeaCard key={item.id} idea={item} />
               ),
            )}
         </div>
         <div className="flex justify-center items-center gap-4">
            <Button
               disabled={page === 1}
               onClick={handlePrevPage}
               variant="outline"
            >
               Previous
            </Button>
            <span>
               Page {page} of {totalPages}
            </span>
            <Button
               disabled={page === totalPages}
               onClick={handleNextPage}
               variant="outline"
            >
               Next
            </Button>
         </div>
      </main>
   );
}
