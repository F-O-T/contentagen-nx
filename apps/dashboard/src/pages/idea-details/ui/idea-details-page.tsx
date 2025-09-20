import { useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { translate } from "@packages/localization";

import { useTRPC } from "@/integrations/clients";
import { IdeaDetailsQuickActions } from "./idea-details-quick-actions";
import { IdeaStatsCard } from "./idea-stats-card";
import { IdeaContentCard } from "./idea-content-card";
import { IdeaRationaleCard } from "./idea-rationale-card";
import { IdeaMetaCard } from "./idea-meta-card";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";

export function IdeaDetailsPage() {
   const { id } = useParams({ from: "/_dashboard/ideas/$id" });
   const trpc = useTRPC();
   const { data: idea } = useSuspenseQuery(
      trpc.ideas.getIdeaById.queryOptions({ id }),
   );

   return (
      <main className="flex flex-col gap-4">
         <TalkingMascot
            message={translate("pages.idea-details.mascot-message")}
         />
         <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
            <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
               <IdeaStatsCard idea={idea} />
               <IdeaRationaleCard idea={idea} />
            </div>
            <div className="col-span-1 gap-4 flex flex-col">
               <IdeaDetailsQuickActions idea={idea} />
               <IdeaContentCard idea={idea} />
               <IdeaMetaCard idea={idea} />
            </div>
         </div>
      </main>
   );
}
