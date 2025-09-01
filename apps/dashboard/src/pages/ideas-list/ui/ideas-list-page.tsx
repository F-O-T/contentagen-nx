import { useSuspenseQuery } from "@tanstack/react-query";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { IdeaCard } from "./idea-card";
import { IdeasListToolbar } from "./ideas-list-toolbar";
import { IdeasListProvider, useIdeasList } from "../lib/ideas-list-context";
import { useTRPC } from "@/integrations/clients";
import type { RouterOutput } from "@packages/api/client";

function IdeasListPageContent() {
   const trpc = useTRPC();
   const { page, limit } = useIdeasList();
   const { data } = useSuspenseQuery(
      trpc.ideas.listAllIdeas.queryOptions({ page, limit }),
   );

   return (
      <main className="h-full w-full flex flex-col gap-4 p-4">
         <TalkingMascot message="Here you can manage all your ideas. Create, edit, or explore your creative concepts below!" />
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

export function IdeasListPage() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.ideas.listAllIdeas.queryOptions({ page: 1, limit: 8 }),
   );

   return (
      <IdeasListProvider data={data}>
         <IdeasListPageContent />
      </IdeasListProvider>
   );
}
