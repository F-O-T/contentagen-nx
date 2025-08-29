import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ContentRequestCard } from "@/pages/content-list/ui/content-card";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { useMemo } from "react";
import { Button } from "@packages/ui/components/button";
import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";

interface AgentContentPageProps {
   agentId: string;
}

export function AgentContentPage({ agentId }: AgentContentPageProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [page, setPage] = useState(1);
   const [limit] = useState(7);

   const { data } = useSuspenseQuery(
      trpc.content.listByAgentId.queryOptions({
         agentId,
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
      }),
   );

   const hasGeneratingContent = useMemo(
      () =>
         data?.some(
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
      [data],
   );

   useSubscription(
      trpc.content.onStatusChanged.subscriptionOptions(
         {},
         {
            onData(statusData) {
               toast.success(`Content status updated to ${statusData.status}`);
               queryClient.invalidateQueries({
                  queryKey: trpc.content.listByAgentId.queryKey({
                     agentId,
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
                  }),
               });
            },
            enabled: hasGeneratingContent,
         },
      ),
   );

   const totalPages = useMemo(() => {
      return Math.ceil(data.length / limit);
   }, [data.length, limit]);

   const paginatedData = useMemo(() => {
      const start = (page - 1) * limit;
      const end = start + limit;
      return data.slice(start, end);
   }, [data, page, limit]);

   const handlePrevPage = useCallback(() => {
      setPage((p) => Math.max(1, p - 1));
   }, []);

   const handleNextPage = useCallback(() => {
      setPage((p) => Math.min(totalPages, p + 1));
   }, [totalPages]);

   return (
      <main className="h-full w-full flex flex-col gap-4">
         <div className="flex items-center gap-4">
            <Link to="/agents/$agentId" params={{ agentId }}>
               <Button variant="outline" size="sm">
                  ← Back to Agent
               </Button>
            </Link>
            <TalkingMascot message="Content produced by this agent." />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {paginatedData.map((item) => (
               <ContentRequestCard key={item.id} request={item} />
            ))}
         </div>
         {data.length > limit && (
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
         )}
      </main>
   );
}
