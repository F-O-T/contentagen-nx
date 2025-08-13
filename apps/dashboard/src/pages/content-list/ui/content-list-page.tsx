import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ContentRequestCard } from "@/widgets/content-card/ui/content-card";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { useMemo } from "react";

export function ContentListPage() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { data } = useSuspenseQuery(trpc.content.listByUserId.queryOptions());

   const hasGenerating = useMemo(
      () => data.some((item) => item.status === "generating"),
      [data],
   );

   useSubscription(
      trpc.content.onStatusChanged.subscriptionOptions(
         {},
         {
            onData(data) {
               toast.success(
                  `Content finished generation, status updated to ${data.status}`,
               );
               queryClient.invalidateQueries({
                  queryKey: trpc.content.listByUserId.queryKey(),
               });
            },
            enabled: hasGenerating,
         },
      ),
   );

   return (
      <main className="h-full w-full flex flex-col gap-4">
         <TalkingMascot message="Here you can manage all your content requests. Create, edit, or explore your requests below!" />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.map((item) => (
               <ContentRequestCard key={item.id} request={item} />
            ))}
         </div>
      </main>
   );
}
