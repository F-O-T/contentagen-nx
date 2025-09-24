import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { Suspense } from "react";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { translate } from "@packages/localization";
import { CompetitorCardsList } from "./competitor-cards-list";
import { CompetitorCardsSkeleton } from "./competitor-cards-skeleton";
import { CompetitorListToolbar } from "./competitor-list-toolbar";
import { CompetitorListProvider } from "../lib/competitor-list-context";

function CompetitorListPageContent() {
   return (
      <main className="h-full w-full flex flex-col gap-4">
         <TalkingMascot
            message={translate("pages.competitor-list.mascot-message")}
         />
         <CompetitorListToolbar />
         <Suspense fallback={<CompetitorCardsSkeleton />}>
            <CompetitorCardsList />
         </Suspense>
      </main>
   );
}

export function CompetitorListPage() {
   const trpc = useTRPC();
   const search = useSearch({ from: "/_dashboard/competitors/" });

   const { data } = useSuspenseQuery(
      trpc.competitor.list.queryOptions({
         page: search.page,
         limit: 12,
         search: search.search,
      }),
   );

   return (
      <CompetitorListProvider data={data}>
         <CompetitorListPageContent />
      </CompetitorListProvider>
   );
}
