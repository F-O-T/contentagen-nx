import { Suspense } from "react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ContentCardsList } from "./content-cards-list";
import { ContentCardsSkeleton } from "./content-cards-skeleton";
import { ContentListToolbar } from "./content-list-toolbar";
import {
   ContentListProvider,
   useContentList,
} from "../lib/content-list-context";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

//TODO: criar um component padrao para paginacao + toolbar, bulk actions de aprovar, deletar ou rejeitar
function ContentListPageContent() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { page, limit, hasGeneratingContent } = useContentList();

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
                        "grammar_checking",
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

   return (
      <main className="h-full w-full flex flex-col gap-4 p-4">
         <TalkingMascot message="Here you can manage all your content requests. Create, edit, or explore your requests below!" />
         <ContentListToolbar />
         <Suspense fallback={<ContentCardsSkeleton />}>
            <ContentCardsList />
         </Suspense>
      </main>
   );
}

export function ContentListPage() {
   const trpc = useTRPC();
   const { data: agents } = useSuspenseQuery(trpc.agent.list.queryOptions());
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
            "grammar_checking",
         ],
         page: 1,
         limit: 8,
      }),
   );

   return (
      <ContentListProvider data={data} agents={agents}>
         <ContentListPageContent />
      </ContentListProvider>
   );
}
