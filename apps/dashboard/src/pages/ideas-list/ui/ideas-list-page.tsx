import { useSuspenseQuery } from "@tanstack/react-query";
import { translate } from "@packages/localization";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { IdeaCard } from "./idea-card";
import { IdeasListToolbar } from "./ideas-list-toolbar";
import { IdeasListProvider, useIdeasList } from "../lib/ideas-list-context";
import { useTRPC } from "@/integrations/clients";
import type { RouterOutput } from "@packages/api/client";

interface IdeasListPageProps {
   agentId?: string;
}

function IdeasListPageContent() {
   const trpc = useTRPC();
   const { page, limit, agentId } = useIdeasList();

   const message = agentId
      ? translate("pages.ideas-list.mascot-message.agent-specific")
      : translate("pages.ideas-list.mascot-message.general");

   const queryOptions = trpc.ideas.listAllIdeas.queryOptions({
      page,
      limit,
      agentId,
   });

   const { data } = useSuspenseQuery(queryOptions);

   return (
      <main className="h-full w-full flex flex-col gap-4 ">
         <TalkingMascot message={message} />
         <IdeasListToolbar />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.items.map(
               (
                  item: RouterOutput["ideas"]["listAllIdeas"]["items"][number],
               ) => (
                  <IdeaCard key={item.id} idea={item} />
               ),
            )}
         </div>
      </main>
   );
}

export function IdeasListPage({ agentId }: IdeasListPageProps) {
   const trpc = useTRPC();

   const { data } = useSuspenseQuery(
      trpc.ideas.listAllIdeas.queryOptions({
         agentId: agentId ?? "",
         page: 1,
         limit: 8,
      }),
   );

   return (
      <IdeasListProvider data={data} agentId={agentId}>
         <IdeasListPageContent />
      </IdeasListProvider>
   );
}
