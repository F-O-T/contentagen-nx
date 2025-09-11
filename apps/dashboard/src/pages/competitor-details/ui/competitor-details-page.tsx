import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { CompetitorDetailsActions } from "./competitor-details-actions";
import { CompetitorStatsCard } from "./competitor-stats-card";
import { CompetitorFeaturesCard } from "./competitor-features-card";
import { CompetitorInfoCard } from "./competitor-info-card";
import { CreateEditCompetitorDialog } from "../../competitor-list/features/create-edit-competitor-dialog";
import { useState } from "react";

export function CompetitorDetailsPage() {
   const trpc = useTRPC();
   const { id } = useParams({ from: "/_dashboard/competitors/$id" });
   const [showEditDialog, setShowEditDialog] = useState(false);

   const { data: competitor } = useSuspenseQuery(
      trpc.competitor.get.queryOptions({ id }),
   );



   return (
      <>
         <main className="h-full w-full flex flex-col gap-4">
            <TalkingMascot message="View detailed information about this competitor and track their features!" />

            <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
               <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                  <CompetitorStatsCard />
                  <CompetitorFeaturesCard features={competitor.features} />
               </div>

               <div className="col-span-1 gap-4 flex flex-col">
                  <CompetitorDetailsActions competitor={competitor} />
                  <CompetitorInfoCard
                     name={competitor.name}
                     websiteUrl={competitor.websiteUrl}
                     createdAt={competitor.createdAt}
                     updatedAt={competitor.updatedAt}
                  />

               </div>
            </div>
         </main>

         <CreateEditCompetitorDialog
            competitor={competitor}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
         />
      </>
   );
}





