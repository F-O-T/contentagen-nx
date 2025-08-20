import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ContentRequestCard } from "./content-card";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { useMemo } from "react";
import { CreateContentCredenza } from "../features/create-content-credenza";
import { useState, useCallback } from "react";
import { Button } from "@packages/ui/components/button";

export function ContentListPage() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [page, setPage] = useState(1);
   const [limit] = useState(7);
   const { data } = useSuspenseQuery(
      trpc.content.listAllContent.queryOptions({
         status: [
            "draft",
            "approved",
            "pending",
            "planning",
            "researching",
            "writing",
            "editing",
            "analyzing",
         ],
         page,
         limit,
      }),
   );

   const hasGeneratingContent = useMemo(
      () =>
         data?.items?.some(
            (item) =>
               item.status &&
               [
                  "pending",
                  "planning",
                  "researching",
                  "writing",
                  "editing",
                  "analyzing",
               ].includes(item.status),
         ) || false,
      [data?.items],
   );

   useSubscription(
      trpc.content.onStatusChanged.subscriptionOptions(
         {},
         {
            onData(statusData) {
               toast.success(`Content status updated to ${statusData.status}`);
               queryClient.invalidateQueries({
                  queryKey: trpc.content.listAllContent.queryKey({
                     status: [
                        "draft",
                        "approved",
                        "pending",
                        "planning",
                        "researching",
                        "writing",
                        "editing",
                        "analyzing",
                     ],
                     page,
                     limit,
                  }),
               });
            },
            enabled: hasGeneratingContent,
         },
      ),
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
         <TalkingMascot message="Here you can manage all your content requests. Create, edit, or explore your requests below!" />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CreateContentCredenza />
            {data.items.map((item) => (
               <ContentRequestCard key={item.id} request={item} />
            ))}
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
